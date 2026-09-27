-- Presets are available to every user without a copy per user: entries point
-- at a preset (preset_id) or at one of the user's own categories
-- (category_id). Limits for either live in categories_limits, one row per
-- limited category. A new preset is available to everyone immediately.

-- ---------------------------------------------------------------------------
-- Entries: a preset or an own category (or neither, e.g. income)
-- ---------------------------------------------------------------------------
alter table public.entries
  add column preset_id text null references public.categories_presets (id) on update cascade;
create index entries_preset_id_idx on public.entries (preset_id);

-- Entries of per-user preset copies point at the preset itself.
update public.entries e
set preset_id = c.preset_id, category_id = null
from public.categories c
where c.id = e.category_id and c.preset_id is not null;

alter table public.entries
  add constraint entries_one_category check (num_nonnulls(category_id, preset_id) <= 1);

grant insert (preset_id), update (preset_id) on public.entries to authenticated;

-- ---------------------------------------------------------------------------
-- Limits per category, for presets and own categories alike
-- ---------------------------------------------------------------------------
create table public.categories_limits (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid null,
  preset_id text null references public.categories_presets (id) on update cascade on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  created_at timestamp with time zone not null default now(),
  constraint categories_limits_pkey primary key (id),
  constraint categories_limits_one_category check (num_nonnulls(category_id, preset_id) = 1),
  constraint categories_limits_category_key unique nulls not distinct (profile_id, category_id, preset_id),
  constraint categories_limits_category_fkey foreign key (category_id, profile_id)
    references public.categories (id, profile_id) on delete cascade
);
create index categories_limits_category_idx on public.categories_limits (category_id, profile_id);
create index categories_limits_preset_id_idx on public.categories_limits (preset_id);

insert into public.categories_limits (profile_id, category_id, preset_id, amount)
select profile_id, case when preset_id is null then id end, preset_id, monthly_limit
from public.categories
where monthly_limit > 0;

alter table public.categories_limits enable row level security;
revoke all on public.categories_limits from anon, authenticated;
grant select, delete on public.categories_limits to authenticated;
grant insert (id, profile_id, category_id, preset_id, amount) on public.categories_limits to authenticated;
grant update (amount) on public.categories_limits to authenticated;

create policy "Limits belong to their owner" on public.categories_limits
for all to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

-- ---------------------------------------------------------------------------
-- Categories: only the ones users create themselves
-- ---------------------------------------------------------------------------
delete from public.categories where preset_id is not null;
alter table public.categories drop column preset_id, drop column monthly_limit;
comment on table public.categories is 'Categories users create themselves; presets are shared.';

-- ---------------------------------------------------------------------------
-- Budget notifications read limits from categories_limits
-- ---------------------------------------------------------------------------
create or replace function private.queue_entry_notifications_for(p_profile_id uuid, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.profiles;
  zone text;
  current_period date;
  period_from timestamp with time zone;
  period_to timestamp with time zone;
  target record;
  spent numeric;
  added numeric;
  free_limit integer;
  remaining integer;
begin
  perform pg_advisory_xact_lock(hashtext('entry-notifications:' || p_profile_id::text));
  select * into profile from public.profiles where id = p_profile_id;
  zone := case when exists (select 1 from pg_catalog.pg_timezone_names where name = profile.time_zone)
    then profile.time_zone else 'UTC' end;
  current_period := private.budget_period_start(profile.month_start_day, zone);
  period_from := current_period::timestamp at time zone zone;
  period_to := (current_period + interval '1 month')::timestamp at time zone zone;

  -- One target per touched category with a limit, or the whole month in monthly mode.
  for target in
    select coalesce(l.preset_id, l.category_id::text) as scope, l.amount as budget,
      coalesce(p.names ->> profile.locale, p.names ->> 'en', c.name) as label,
      l.category_id, l.preset_id
    from public.categories_limits l
    left join public.categories_presets p on p.id = l.preset_id
    left join public.categories c on c.id = l.category_id
    where profile.budget_mode = 'per_category'
      and l.profile_id = p_profile_id
      and exists (
        select 1 from public.entries e
        where e.id = any(p_ids)
          and (e.category_id = l.category_id or e.preset_id = l.preset_id)
      )
    union all
    select 'monthly', profile.monthly_budget,
      case profile.locale
        when 'de' then 'Monatsbudget' when 'es' then 'Presupuesto mensual'
        when 'fr' then 'Budget mensuel' when 'it' then 'Budget mensile'
        when 'pt' then 'Orçamento mensal' when 'pt-BR' then 'Orçamento mensal'
        else 'Monthly budget' end,
      null, null
    where profile.budget_mode = 'monthly'
  loop
    continue when coalesce(target.budget, 0) <= 0;
    select coalesce(sum(amount), 0), coalesce(sum(amount) filter (where id = any(p_ids)), 0)
    into spent, added
    from public.entries
    where profile_id = p_profile_id and kind = 'expense'
      and occurred_at >= period_from and occurred_at < period_to
      and (target.category_id is null or category_id = target.category_id)
      and (target.preset_id is null or preset_id = target.preset_id);
    continue when added = 0;

    if spent - added < target.budget and spent >= target.budget then
      perform private.queue_notification(p_profile_id, 'budget_exceeded',
        target.scope || ':' || current_period, jsonb_build_object('category', target.label));
    elsif spent - added < target.budget * 0.8 and spent >= target.budget * 0.8 then
      perform private.queue_notification(p_profile_id, 'budget_warning',
        target.scope || ':' || current_period,
        jsonb_build_object('category', target.label, 'percent', floor(spent / target.budget * 100)));
    end if;
  end loop;

  if not coalesce(profile.plus_expires_at > now(), false) then
    select (value #>> '{}')::integer into free_limit from public.app_config where key = 'free_entries';
    select coalesce(free_limit, 15) - a.used into remaining from public.entries_allowance a
    where a.profile_id = p_profile_id and a.period_start = current_period;
    if remaining <= 3 and remaining + cardinality(p_ids) > 3 then
      perform private.queue_notification(p_profile_id, 'limit_almost_reached',
        current_period::text, jsonb_build_object('remaining', remaining));
    end if;
  end if;
end;
$$;

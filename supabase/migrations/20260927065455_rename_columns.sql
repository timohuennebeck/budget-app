-- Clearer names: template and notification paths (app routes, not URLs),
-- preset ids, budget periods and capture durations. app_config.updated_by
-- was never used. Functions that name these columns are re-created.

alter table public.notifications_templates rename column url to path;

-- The push payload only ever carried the path; the notification id is added
-- when it's sent.
alter table public.notifications add column path text null;
update public.notifications set path = coalesce(data ->> 'path', data ->> 'url');
alter table public.notifications drop column data;

alter table public.categories_presets rename column key to id;
alter table public.categories rename column preset_key to preset_id;
alter table public.categories rename constraint categories_profile_id_preset_key_key
  to categories_profile_id_preset_id_key;
alter index public.categories_preset_key_idx rename to categories_preset_id_idx;
alter table public.categories rename constraint categories_preset_key_fkey
  to categories_preset_id_fkey;

alter table public.entries_allowance rename column cycle_start to period_start;
alter table public.captures rename column latency_ms to duration_ms;
alter table public.app_config drop column updated_by;

-- First day of the budget month containing `at`, in the profile's time
-- zone (UTC when the stored name is invalid). Mirrors budgetCycle() in the app.
create or replace function private.budget_period_start(
  month_start_day smallint,
  time_zone text,
  at timestamp with time zone default now()
)
returns date
language plpgsql
stable
set search_path = ''
as $$
declare
  today date;
  period_start date;
begin
  begin
    today := (at at time zone time_zone)::date;
  exception when invalid_parameter_value then
    today := (at at time zone 'UTC')::date;
  end;
  period_start := make_date(extract(year from today)::int, extract(month from today)::int, month_start_day);
  if period_start > today then
    period_start := (period_start - interval '1 month')::date;
  end if;
  return period_start;
end;
$$;

create or replace function private.enforce_entries_allowance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.profiles;
  free_limit integer;
begin
  new.created_at := now();
  if auth.uid() is null then
    return new;
  end if;

  select * into profile from public.profiles where id = new.profile_id;
  if profile.plus_expires_at > now() then
    return new;
  end if;

  select (value #>> '{}')::integer into free_limit
  from public.app_config where key = 'free_entries';
  free_limit := coalesce(free_limit, 15);

  insert into public.entries_allowance as allowance (profile_id, period_start, used)
  values (
    new.profile_id,
    private.budget_period_start(profile.month_start_day, profile.time_zone),
    1
  )
  on conflict (profile_id, period_start) do update
    set used = allowance.used + 1
    where allowance.used < free_limit;

  if not found then
    raise exception 'entry_limit_reached' using errcode = 'P0001', detail = free_limit::text;
  end if;
  return new;
end;
$$;

create or replace function private.carry_entries_allowance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_period date;
  new_period date;
  used_count integer;
begin
  if new.time_zone is distinct from old.time_zone
    and not exists (select 1 from pg_catalog.pg_timezone_names where name = new.time_zone)
  then
    raise exception 'invalid_time_zone' using errcode = '22023';
  end if;
  old_period := private.budget_period_start(old.month_start_day, old.time_zone);
  new_period := private.budget_period_start(new.month_start_day, new.time_zone);
  if new_period <> old_period then
    select a.used into used_count from public.entries_allowance a
    where a.profile_id = new.id and a.period_start = old_period;
    if used_count > 0 then
      insert into public.entries_allowance as a (profile_id, period_start, used)
      values (new.id, new_period, used_count)
      on conflict (profile_id, period_start) do update set used = greatest(a.used, excluded.used);
    end if;
  end if;
  return new;
end;
$$;

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

  -- One target per touched category, or the whole month in monthly mode.
  for target in
    select c.id::text as scope, c.monthly_limit as budget,
      coalesce(p.names ->> profile.locale, p.names ->> 'en', c.name) as label, c.id as category_id
    from public.categories c
    left join public.categories_presets p on p.id = c.preset_id
    where profile.budget_mode = 'per_category'
      and c.id in (select category_id from public.entries where id = any(p_ids))
    union all
    select 'monthly', profile.monthly_budget,
      case profile.locale
        when 'de' then 'Monatsbudget' when 'es' then 'Presupuesto mensual'
        when 'fr' then 'Budget mensuel' when 'it' then 'Budget mensile'
        when 'pt' then 'Orçamento mensal' when 'pt-BR' then 'Orçamento mensal'
        else 'Monthly budget' end,
      null
    where profile.budget_mode = 'monthly'
  loop
    continue when coalesce(target.budget, 0) <= 0;
    select coalesce(sum(amount), 0), coalesce(sum(amount) filter (where id = any(p_ids)), 0)
    into spent, added
    from public.entries
    where profile_id = p_profile_id and kind = 'expense'
      and occurred_at >= period_from and occurred_at < period_to
      and (target.category_id is null or category_id = target.category_id);
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

-- Renders the user's template (their language, English as fallback) and
-- queues it once per dedupe key, if they have this kind switched on.
create or replace function private.queue_notification(
  p_profile_id uuid,
  p_kind public.notification_kind,
  p_dedupe_key text,
  p_vars jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.profiles;
  template public.notifications_templates;
  vars jsonb;
  title text;
  content text;
  placeholder record;
begin
  if not exists (
    select 1 from public.notifications_settings
    where profile_id = p_profile_id and kind = p_kind and enabled
  ) then
    return;
  end if;

  select * into profile from public.profiles where id = p_profile_id;
  select * into template from public.notifications_templates
  where kind = p_kind and locale in (profile.locale, 'en') and active
  order by locale = profile.locale desc
  limit 1;
  if not found then
    return;
  end if;

  vars := jsonb_build_object('name', profile.first_name) || p_vars;
  title := template.title;
  content := template.content;
  for placeholder in select key, value from jsonb_each_text(vars) loop
    title := replace(title, '{{' || placeholder.key || '}}', coalesce(placeholder.value, ''));
    content := replace(content, '{{' || placeholder.key || '}}', coalesce(placeholder.value, ''));
  end loop;

  insert into public.notifications (profile_id, kind, title, content, path, dedupe_key)
  values (p_profile_id, p_kind, title, content, template.path, p_dedupe_key)
  on conflict (profile_id, kind, dedupe_key) do nothing;
end;
$$;

drop function private.budget_cycle_start(smallint, text, timestamp with time zone);

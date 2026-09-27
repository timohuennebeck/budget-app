-- Fixes from the backend review: limits that could be sidestepped, receipt
-- paths, notification edge cases and push token checks.

-- ---------------------------------------------------------------------------
-- Entry allowance: changing month_start_day or time_zone moves the budget
-- month; the new month keeps the count so far instead of starting at zero.
-- Time zones are checked here too, like at sign-up.
-- ---------------------------------------------------------------------------
create or replace function private.carry_entries_allowance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_cycle date;
  new_cycle date;
  used_count integer;
begin
  if new.time_zone is distinct from old.time_zone
    and not exists (select 1 from pg_catalog.pg_timezone_names where name = new.time_zone)
  then
    raise exception 'invalid_time_zone' using errcode = '22023';
  end if;
  old_cycle := private.budget_cycle_start(old.month_start_day, old.time_zone);
  new_cycle := private.budget_cycle_start(new.month_start_day, new.time_zone);
  if new_cycle <> old_cycle then
    select a.used into used_count from public.entries_allowance a
    where a.profile_id = new.id and a.cycle_start = old_cycle;
    if used_count > 0 then
      insert into public.entries_allowance as a (profile_id, cycle_start, used)
      values (new.id, new_cycle, used_count)
      on conflict (profile_id, cycle_start) do update set used = greatest(a.used, excluded.used);
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_carry_entries_allowance
before update of month_start_day, time_zone on public.profiles
for each row execute function private.carry_entries_allowance();

-- ---------------------------------------------------------------------------
-- AI captures: the daily limit is checked and the row claimed in one locked
-- step, so parallel requests can't slip past it or parse one voice capture
-- twice. Called by the edge functions (service role) only.
-- ---------------------------------------------------------------------------
alter type public.capture_status add value if not exists 'processing' after 'pending';

create or replace function public.claim_ai_capture(
  p_profile_id uuid,
  p_source public.entry_source,
  p_status public.capture_status,
  p_capture_id uuid default null,
  p_input_text text default null,
  p_receipt_path text default null,
  p_provider text default null,
  p_model text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed uuid;
  daily_limit integer;
begin
  perform pg_advisory_xact_lock(hashtext('captures:' || p_profile_id::text));

  -- A voice capture from transcribe-session: parse it once, soon after.
  if p_capture_id is not null
    and exists (select 1 from public.captures where id = p_capture_id and source = 'voice')
  then
    update public.captures
    set status = p_status, input_text = p_input_text
    where id = p_capture_id and profile_id = p_profile_id and status = 'pending'
      and created_at > now() - interval '15 minutes'
    returning id into claimed;
    if claimed is null then
      raise exception 'capture_already_parsed' using errcode = 'P0001';
    end if;
    return claimed;
  end if;

  select (c.value #>> '{}')::integer into daily_limit
  from public.app_config c
  where c.key = case
    when (select plus_expires_at > now() from public.profiles where id = p_profile_id)
    then 'ai_captures_plus' else 'ai_captures_free' end;
  if (select count(*) from public.captures
      where profile_id = p_profile_id and created_at > now() - interval '24 hours')
    >= coalesce(daily_limit, 20)
  then
    raise exception 'ai_limit_reached' using errcode = 'P0001';
  end if;

  insert into public.captures
    (id, profile_id, source, status, input_text, receipt_path, provider, model)
  values (
    coalesce(p_capture_id, gen_random_uuid()), p_profile_id, p_source, p_status,
    p_input_text, p_receipt_path, p_provider, p_model
  )
  returning id into claimed;
  return claimed;
end;
$$;

revoke execute on function public.claim_ai_capture(
  uuid, public.entry_source, public.capture_status, uuid, text, text, text, text
) from public, anon, authenticated;
grant execute on function public.claim_ai_capture(
  uuid, public.entry_source, public.capture_status, uuid, text, text, text, text
) to service_role;

-- Receipt photos are '{profile_id}/{capture_id}.{ext}', nothing else.
alter table public.captures drop constraint captures_receipt_in_own_folder;
alter table public.captures add constraint captures_receipt_in_own_folder check (
  receipt_path is null
  or receipt_path ~ ('^' || profile_id::text || '/[0-9a-f-]{36}\.(jpg|jpeg|png|webp|heic)$')
);

-- An entry can only point at its owner's capture.
alter table public.captures add constraint captures_id_profile_key unique (id, profile_id);
alter table public.entries drop constraint entries_capture_id_fkey;
alter table public.entries add constraint entries_capture_fkey
  foreign key (capture_id, profile_id) references public.captures (id, profile_id)
  on delete set null (capture_id);
drop index if exists public.entries_capture_id_idx;
create index entries_capture_idx on public.entries (capture_id, profile_id);

-- ---------------------------------------------------------------------------
-- Notifications
-- ---------------------------------------------------------------------------

-- "Already captured today" starts at local midnight, also on DST days.
create or replace function private.queue_due_notifications()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  setting record;
  zone text;
  local_now timestamp;
  this_week date;
begin
  for setting in
    select p.id, p.time_zone, s.kind, s.time, s.repeat
    from public.notifications_settings s
    join public.profiles p on p.id = s.profile_id
    where s.enabled and s.kind in ('daily_reminder', 'check_in_open', 'check_in_closing')
      and exists (select 1 from public.push_tokens t where t.profile_id = p.id)
  loop
    zone := case when exists (select 1 from pg_catalog.pg_timezone_names where name = setting.time_zone)
      then setting.time_zone else 'UTC' end;
    local_now := now() at time zone zone;
    this_week := date_trunc('week', local_now)::date;

    if setting.kind = 'daily_reminder'
      and local_now >= local_now::date + setting.time
      and local_now < local_now::date + setting.time + interval '30 minutes'
      and (setting.repeat = 'daily' or extract(isodow from local_now) < 6)
      and not exists (
        select 1 from public.entries e
        where e.profile_id = setting.id
          and e.created_at >= local_now::date::timestamp at time zone zone
      )
    then
      perform private.queue_notification(setting.id, 'daily_reminder', local_now::date::text);

    elsif setting.kind = 'check_in_open'
      and extract(isodow from local_now) = 7
      and local_now::time >= '18:00' and local_now::time < '18:30'
    then
      perform private.queue_notification(setting.id, 'check_in_open', this_week::text);

    elsif setting.kind = 'check_in_closing'
      and extract(isodow from local_now) = 2
      and local_now::time >= '18:00' and local_now::time < '18:30'
      and not exists (
        select 1 from public.check_ins c
        where c.profile_id = setting.id and c.week_start = this_week - 7
      )
    then
      perform private.queue_notification(setting.id, 'check_in_closing', (this_week - 7)::text);
    end if;
  end loop;
end;
$$;

-- Budget warnings count only expenses inside the current budget month and
-- look at everything one insert added (the review screen saves several
-- entries at once), so a threshold crossed by the batch still fires. The
-- free-entries warning also counts income.
create or replace function private.queue_entry_notifications_for(p_profile_id uuid, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.profiles;
  zone text;
  current_cycle date;
  cycle_from timestamp with time zone;
  cycle_to timestamp with time zone;
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
  current_cycle := private.budget_cycle_start(profile.month_start_day, zone);
  cycle_from := current_cycle::timestamp at time zone zone;
  cycle_to := (current_cycle + interval '1 month')::timestamp at time zone zone;

  -- One target per touched category, or the whole month in monthly mode.
  for target in
    select c.id::text as scope, c.monthly_limit as budget,
      coalesce(p.names ->> profile.locale, p.names ->> 'en', c.name) as label, c.id as category_id
    from public.categories c
    left join public.categories_presets p on p.key = c.preset_key
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
      and occurred_at >= cycle_from and occurred_at < cycle_to
      and (target.category_id is null or category_id = target.category_id);
    continue when added = 0;

    if spent - added < target.budget and spent >= target.budget then
      perform private.queue_notification(p_profile_id, 'budget_exceeded',
        target.scope || ':' || current_cycle, jsonb_build_object('category', target.label));
    elsif spent - added < target.budget * 0.8 and spent >= target.budget * 0.8 then
      perform private.queue_notification(p_profile_id, 'budget_warning',
        target.scope || ':' || current_cycle,
        jsonb_build_object('category', target.label, 'percent', floor(spent / target.budget * 100)));
    end if;
  end loop;

  if not coalesce(profile.plus_expires_at > now(), false) then
    select (value #>> '{}')::integer into free_limit from public.app_config where key = 'free_entries';
    select coalesce(free_limit, 15) - a.used into remaining from public.entries_allowance a
    where a.profile_id = p_profile_id and a.cycle_start = current_cycle;
    if remaining <= 3 and remaining + cardinality(p_ids) > 3 then
      perform private.queue_notification(p_profile_id, 'limit_almost_reached',
        current_cycle::text, jsonb_build_object('remaining', remaining));
    end if;
  end if;
end;
$$;

create or replace function private.queue_entry_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  batch record;
begin
  for batch in select profile_id, array_agg(id) as ids from new_entries group by profile_id loop
    perform private.queue_entry_notifications_for(batch.profile_id, batch.ids);
  end loop;
  return null;
end;
$$;

drop trigger entries_queue_notifications on public.entries;
create trigger entries_queue_notifications after insert on public.entries
referencing new table as new_entries
for each statement execute function private.queue_entry_notifications();

-- The app has no '/' route once signed in; budget taps open the overview.
update public.notifications_templates set url = '/overview' where url = '/';

-- Only Expo push tokens, and at most 10 devices per user (oldest dropped).
create or replace function public.register_push_token(p_token text, p_platform public.platform)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_token !~ '^Expo(nent)?PushToken\[[A-Za-z0-9_-]{10,}\]$' then
    raise exception 'invalid_push_token' using errcode = '22023';
  end if;
  insert into public.push_tokens (token, profile_id, platform)
  values (p_token, auth.uid(), p_platform)
  on conflict (token) do update
    set profile_id = excluded.profile_id, platform = excluded.platform, updated_at = now();
  delete from public.push_tokens
  where profile_id = auth.uid()
    and token not in (
      select token from public.push_tokens where profile_id = auth.uid()
      order by updated_at desc limit 10
    );
end;
$$;

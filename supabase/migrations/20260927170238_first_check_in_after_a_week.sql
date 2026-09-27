-- A new user's first check-in opens a week or more after signup (as in the
-- app), so the Sunday and Tuesday check-in pushes skip that first week.
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
  first_check_in date;
begin
  for setting in
    select p.id, p.time_zone, coalesce(p.onboarded_at, p.created_at) as signed_up_at,
      s.kind, s.time, s.repeat
    from public.notifications_settings s
    join public.profiles p on p.id = s.profile_id
    where s.enabled and s.kind in ('daily_reminder', 'check_in_open', 'check_in_closing')
      and exists (select 1 from public.push_tokens t where t.profile_id = p.id)
  loop
    zone := case when exists (select 1 from pg_catalog.pg_timezone_names where name = setting.time_zone)
      then setting.time_zone else 'UTC' end;
    local_now := now() at time zone zone;
    this_week := date_trunc('week', local_now)::date;
    -- Earliest Sunday a check-in may open for this user
    first_check_in := (setting.signed_up_at at time zone zone)::date + 7;

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
      and local_now::date >= first_check_in
    then
      perform private.queue_notification(setting.id, 'check_in_open', this_week::text);

    elsif setting.kind = 'check_in_closing'
      and extract(isodow from local_now) = 2
      and local_now::time >= '18:00' and local_now::time < '18:30'
      -- The closing window opened on Sunday, the day before this week
      and this_week - 1 >= first_check_in
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

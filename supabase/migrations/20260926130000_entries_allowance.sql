-- Free-plan entry limit, enforced where entries are written. One counter row
-- per user and budget month; it never goes down, so deleting an entry does
-- not free a slot. Plus users (plus_expires_at in the future) are unlimited.

create table public.entries_allowance (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  cycle_start date not null,
  used integer not null default 0 check (used >= 0),
  constraint entries_allowance_pkey primary key (profile_id, cycle_start)
);

alter table public.entries_allowance enable row level security;
revoke all on public.entries_allowance from anon, authenticated;
grant select on public.entries_allowance to authenticated;

create policy "Allowance is readable by its owner" on public.entries_allowance
for select to authenticated using ((select auth.uid()) = profile_id);

-- Counts the entry against the current budget month (month_start_day in the
-- profile's time zone) and rejects it once `free_entries` is used up. The
-- conditional upsert is atomic, so parallel inserts can't overshoot. Writes
-- without a user (service role, seed) skip the check.
create or replace function private.enforce_entries_allowance()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.profiles;
  zone text;
  today date;
  current_cycle date;
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

  zone := case when exists (select 1 from pg_catalog.pg_timezone_names where name = profile.time_zone)
    then profile.time_zone else 'UTC' end;
  today := (now() at time zone zone)::date;
  current_cycle := make_date(extract(year from today)::int, extract(month from today)::int, profile.month_start_day);
  if current_cycle > today then
    current_cycle := (current_cycle - interval '1 month')::date;
  end if;

  select coalesce((value #>> '{}')::integer, 15) into free_limit
  from public.app_config where key = 'free_entries';
  free_limit := coalesce(free_limit, 15);

  insert into public.entries_allowance as allowance (profile_id, cycle_start, used)
  values (new.profile_id, current_cycle, 1)
  on conflict (profile_id, cycle_start) do update
    set used = allowance.used + 1
    where allowance.used < free_limit;

  if not found then
    raise exception 'entry_limit_reached' using errcode = 'P0001', detail = free_limit::text;
  end if;
  return new;
end;
$$;

create trigger entries_allowance before insert on public.entries
for each row execute function private.enforce_entries_allowance();

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

-- First day of the budget month containing `at`, in the profile's time
-- zone (UTC when the stored name is invalid). Mirrors budgetCycle() in the app.
create or replace function private.budget_cycle_start(
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
  cycle_start date;
begin
  begin
    today := (at at time zone time_zone)::date;
  exception when invalid_parameter_value then
    today := (at at time zone 'UTC')::date;
  end;
  cycle_start := make_date(extract(year from today)::int, extract(month from today)::int, month_start_day);
  if cycle_start > today then
    cycle_start := (cycle_start - interval '1 month')::date;
  end if;
  return cycle_start;
end;
$$;

-- Counts the entry against the current budget month and rejects it once
-- `free_entries` is used up. The conditional upsert is atomic, so parallel
-- inserts can't overshoot. Writes without a user (service role, seed) skip
-- the check.
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

  insert into public.entries_allowance as allowance (profile_id, cycle_start, used)
  values (
    new.profile_id,
    private.budget_cycle_start(profile.month_start_day, profile.time_zone),
    1
  )
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

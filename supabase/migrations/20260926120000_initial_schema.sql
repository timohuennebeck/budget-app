-- Looop initial schema: profiles, categories, entries, weekly check-ins,
-- legal documents/acceptances and app config. All user data is scoped to
-- auth.uid() through row level security.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.platform as enum ('ios', 'android', 'web');
create type public.legal_doc_kind as enum ('terms', 'privacy');
create type public.budget_mode as enum ('monthly', 'per_category', 'none');
create type public.entry_kind as enum ('expense', 'income');
create type public.entry_source as enum ('text', 'voice', 'camera', 'manual');
create type public.reminder_repeat as enum ('daily', 'weekdays');
create type public.subscription_plan as enum ('free', 'plus');

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.reject_legal_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'legal_documents are immutable; publish a new version instead';
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid not null references auth.users (id) on delete cascade,
  first_name text not null default '',
  currency text not null default 'EUR',
  locale text not null default 'de',
  birth_date date null,
  budget_mode public.budget_mode not null default 'none',
  monthly_budget numeric(12, 2) null check (monthly_budget is null or monthly_budget >= 0),
  month_start_day smallint not null default 1 check (month_start_day between 1 and 28),
  reminder_enabled boolean not null default false,
  reminder_time time not null default '20:30',
  reminder_repeat public.reminder_repeat not null default 'daily',
  plan public.subscription_plan not null default 'free',
  onboarded_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id)
);

create trigger profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();

-- Every auth user gets a profile; the sign-up call passes onboarding answers
-- as user metadata so the row starts filled in.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, currency, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'currency', 'EUR'),
    coalesce(new.raw_user_meta_data ->> 'locale', 'de')
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  -- Built-in categories carry a stable key so the app can translate the name.
  key text null,
  name text not null,
  icon text not null,
  hue smallint not null check (hue between 0 and 360),
  monthly_limit numeric(12, 2) null check (monthly_limit is null or monthly_limit >= 0),
  sort_order integer not null default 0,
  created_at timestamp with time zone not null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_profile_id_key_key unique (profile_id, key)
);

create index categories_profile_id_idx on public.categories (profile_id);

-- ---------------------------------------------------------------------------
-- Entries
-- ---------------------------------------------------------------------------
create table public.entries (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid null references public.categories (id) on delete set null,
  kind public.entry_kind not null default 'expense',
  title text not null,
  -- The user's share. For split bills `total_amount` keeps the full bill.
  amount numeric(12, 2) not null check (amount > 0),
  total_amount numeric(12, 2) null check (total_amount is null or total_amount >= amount),
  source public.entry_source not null default 'manual',
  is_favorite boolean not null default false,
  occurred_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint entries_pkey primary key (id)
);

create index entries_profile_occurred_idx on public.entries (profile_id, occurred_at desc);
create index entries_category_id_idx on public.entries (category_id);

create trigger entries_updated_at before update on public.entries
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Weekly check-ins
-- ---------------------------------------------------------------------------
create table public.weekly_check_ins (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  guess numeric(12, 2) null check (guess is null or guess >= 0),
  actual numeric(12, 2) null check (actual is null or actual >= 0),
  skipped boolean not null default false,
  created_at timestamp with time zone not null default now(),
  constraint weekly_check_ins_pkey primary key (id),
  constraint weekly_check_ins_profile_id_week_start_key unique (profile_id, week_start)
);

-- ---------------------------------------------------------------------------
-- Legal documents
-- ---------------------------------------------------------------------------
create table public.legal_documents (
  id uuid not null default gen_random_uuid(),
  kind public.legal_doc_kind not null,
  locale text not null default 'pt-BR'::text,
  version text not null,
  content_md text not null,
  effective_at timestamp with time zone not null,
  requires_reacceptance boolean not null default false,
  constraint legal_documents_pkey primary key (id),
  constraint legal_documents_kind_locale_version_key unique (kind, locale, version)
);

create trigger legal_documents_immutable before delete or update on public.legal_documents
for each row execute function private.reject_legal_mutation();

create table public.legal_acceptances (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null,
  document_id uuid not null,
  accepted_at timestamp with time zone not null default now(),
  app_version text null,
  platform public.platform null,
  constraint legal_acceptances_pkey primary key (id),
  constraint legal_acceptances_profile_id_document_id_key unique (profile_id, document_id),
  constraint legal_acceptances_document_id_fkey foreign key (document_id) references public.legal_documents (id),
  constraint legal_acceptances_profile_id_fkey foreign key (profile_id) references public.profiles (id) on delete cascade
);

-- ---------------------------------------------------------------------------
-- App config
-- ---------------------------------------------------------------------------
create table public.app_config (
  key text not null,
  value jsonb not null,
  description text not null,
  updated_at timestamp with time zone not null default now(),
  updated_by uuid null,
  constraint app_config_pkey primary key (key),
  constraint app_config_updated_by_fkey foreign key (updated_by) references public.profiles (id) on delete set null
);

create trigger app_config_updated_at before update on public.app_config
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Account deletion (auth.users cascade removes every owned row)
-- ---------------------------------------------------------------------------
create or replace function public.delete_own_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_own_account() from public, anon;
grant execute on function public.delete_own_account() to authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.entries enable row level security;
alter table public.weekly_check_ins enable row level security;
alter table public.legal_documents enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.app_config enable row level security;

create policy "Profiles are readable by their owner" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy "Profiles are editable by their owner" on public.profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Categories belong to their owner" on public.categories
for all to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

-- Entries may only point at categories of the same owner.
create policy "Entries belong to their owner" on public.entries
for all to authenticated
using ((select auth.uid()) = profile_id)
with check (
  (select auth.uid()) = profile_id
  and (
    category_id is null
    or exists (
      select 1 from public.categories c
      where c.id = category_id and c.profile_id = (select auth.uid())
    )
  )
);

create policy "Check-ins belong to their owner" on public.weekly_check_ins
for all to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

create policy "Legal documents are public" on public.legal_documents
for select to anon, authenticated using (true);

create policy "Acceptances are readable by their owner" on public.legal_acceptances
for select to authenticated using ((select auth.uid()) = profile_id);
create policy "Acceptances are recorded by their owner" on public.legal_acceptances
for insert to authenticated with check ((select auth.uid()) = profile_id);

create policy "App config is public" on public.app_config
for select to anon, authenticated using (true);

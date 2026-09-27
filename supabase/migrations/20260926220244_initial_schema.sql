-- Looop schema: profiles, category presets, categories, entries, check-ins,
-- legal documents and acceptances, and app config. All user data is scoped
-- to auth.uid() through row level security; the app may only write the
-- columns it owns.

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
  first_name text not null default '' check (char_length(first_name) <= 50),
  currency text not null default 'EUR' check (currency ~ '^[A-Z]{3}$'),
  locale text not null default 'en'
    check (locale in ('en', 'de', 'es', 'fr', 'it', 'pt', 'pt-BR')),
  -- IANA name from the device; budget months start at midnight in this zone.
  time_zone text not null default 'UTC',
  birth_date date null check (birth_date between '1900-01-01' and current_date),
  budget_mode public.budget_mode not null default 'none',
  monthly_budget numeric(12, 2) null check (monthly_budget is null or monthly_budget >= 0),
  month_start_day smallint not null default 1 check (month_start_day between 1 and 28),
  -- Copied from RevenueCat by the server; Plus is active while in the future.
  plus_expires_at timestamp with time zone null,
  rating_prompted_at timestamp with time zone null,
  onboarded_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint profiles_pkey primary key (id)
);

create trigger profiles_updated_at before update on public.profiles
for each row execute function private.set_updated_at();

-- Every auth user gets a profile. The sign-up call passes onboarding answers
-- as user metadata; values that would break a constraint fall back to the
-- defaults so a bad client can't block sign-up.
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, first_name, currency, locale, time_zone)
  values (
    new.id,
    left(coalesce(meta ->> 'first_name', ''), 50),
    case when meta ->> 'currency' ~ '^[A-Z]{3}$' then meta ->> 'currency' else 'EUR' end,
    case when meta ->> 'locale' in ('en', 'de', 'es', 'fr', 'it', 'pt', 'pt-BR')
      then meta ->> 'locale' else 'en' end,
    case when exists (select 1 from pg_catalog.pg_timezone_names where name = meta ->> 'time_zone')
      then meta ->> 'time_zone' else 'UTC' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Category presets: every built-in category, readable before sign-up
-- ---------------------------------------------------------------------------
create table public.categories_presets (
  key text not null,
  group_key text not null,
  -- {"en": "Groceries", "de": "Lebensmittel", …} for all app languages
  names jsonb not null,
  -- {"de": ["rewe", "edeka"], …}: words and merchants the parsers match
  keywords jsonb not null default '{}'::jsonb,
  icon text not null,
  hue smallint not null check (hue between 0 and 360),
  -- Average monthly spend of people the same age, shown as a budget hint
  peer_average numeric(12, 2) null,
  suggested boolean not null default false,
  sort_order integer not null default 0,
  constraint categories_presets_pkey primary key (key),
  constraint categories_presets_names_en check (names ? 'en')
);

-- ---------------------------------------------------------------------------
-- Categories: the user's own, from a preset or custom
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  -- The preset this category came from; its name follows the app language.
  preset_key text null references public.categories_presets (key) on update cascade,
  name text not null check (char_length(name) between 1 and 40),
  icon text not null check (char_length(icon) <= 40),
  hue smallint not null check (hue between 0 and 360),
  monthly_limit numeric(12, 2) null check (monthly_limit is null or monthly_limit >= 0),
  sort_order integer not null default 0,
  -- Archived instead of deleted, so past entries keep their category.
  archived_at timestamp with time zone null,
  created_at timestamp with time zone not null default now(),
  constraint categories_pkey primary key (id),
  constraint categories_profile_id_preset_key_key unique (profile_id, preset_key),
  constraint categories_id_profile_id_key unique (id, profile_id)
);

-- ---------------------------------------------------------------------------
-- Entries
-- ---------------------------------------------------------------------------
create table public.entries (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  category_id uuid null,
  kind public.entry_kind not null default 'expense',
  title text not null check (char_length(title) between 1 and 120),
  amount numeric(12, 2) not null check (amount > 0),
  source public.entry_source not null default 'manual',
  is_favorite boolean not null default false,
  occurred_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint entries_pkey primary key (id),
  -- Same owner as the entry; clearing the category keeps the entry.
  constraint entries_category_fkey foreign key (category_id, profile_id)
    references public.categories (id, profile_id) on delete set null (category_id)
);

create index entries_profile_occurred_idx on public.entries (profile_id, occurred_at desc);
create index entries_profile_favorite_idx on public.entries (profile_id) where is_favorite;
create index entries_category_id_idx on public.entries (category_id);

create trigger entries_updated_at before update on public.entries
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Check-ins (weekly spend guess)
-- ---------------------------------------------------------------------------
create table public.check_ins (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  guess numeric(12, 2) null check (guess is null or guess >= 0),
  actual numeric(12, 2) null check (actual is null or actual >= 0),
  skipped boolean not null default false,
  expense_count integer not null default 0 check (expense_count >= 0),
  -- 0–1, how near the guess landed; mirrors guessAccuracy() in the app.
  closeness numeric(4, 3) generated always as (
    case
      when guess is null then null
      when actual is null or actual = 0 then case when guess = 0 then 1 else 0 end
      else greatest(0, 1 - abs(actual - guess) / actual)
    end
  ) stored,
  created_at timestamp with time zone not null default now(),
  constraint check_ins_pkey primary key (id),
  constraint check_ins_profile_id_week_start_key unique (profile_id, week_start),
  constraint check_ins_skipped_has_no_guess check (skipped = (guess is null))
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

create index legal_acceptances_document_id_idx on public.legal_acceptances (document_id);

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

insert into public.app_config (key, value, description) values
  ('free_entries', '15', 'Entries a free user can capture per budget month'),
  ('ai_captures_free', '20', 'AI-parsed captures per day on the free plan'),
  ('ai_captures_plus', '200', 'AI-parsed captures per day on Plus'),
  ('receipt_retention', '30', 'Days a receipt photo is kept after parsing'),
  ('honor_sandbox', 'false', 'Whether sandbox/TestFlight purchases unlock Plus'),
  ('check_in_min_entries', '3', 'Entries needed in a week before the check-in compares numbers'),
  ('check_in_close_ratio', '0.85', 'Closeness from which a weekly guess counts as close'),
  ('plus_pricing', '{"monthly": 6.99, "yearly": 59.88, "trial_days": 7}', 'Looop Plus prices shown on the paywall (EUR)'),
  ('peer_monthly_average', '1150', 'Average monthly spend of people the same age, shown on the monthly budget step'),
  ('support_email', '"hilfe@looop.app"', 'Address opened by Profil › Hilfe')
on conflict (key) do nothing;

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
-- Column grants: the app writes only the columns it owns. Timestamps,
-- ownership and Plus status stay with the database and the server.
-- ---------------------------------------------------------------------------
revoke insert, update on public.profiles from anon, authenticated;
grant update (
  first_name, currency, locale, time_zone, birth_date, budget_mode, monthly_budget,
  month_start_day, rating_prompted_at, onboarded_at
) on public.profiles to authenticated;

revoke insert, update on public.entries from anon, authenticated;
grant insert (
  id, profile_id, category_id, kind, title, amount, source, is_favorite, occurred_at
) on public.entries to authenticated;
grant update (
  category_id, kind, title, amount, is_favorite, occurred_at
) on public.entries to authenticated;

revoke insert, update on public.legal_acceptances from anon, authenticated;
grant insert (id, profile_id, document_id, app_version, platform)
  on public.legal_acceptances to authenticated;

revoke insert, update, delete on public.legal_documents, public.app_config, public.categories_presets
  from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories_presets enable row level security;
alter table public.categories enable row level security;
alter table public.entries enable row level security;
alter table public.check_ins enable row level security;
alter table public.legal_documents enable row level security;
alter table public.legal_acceptances enable row level security;
alter table public.app_config enable row level security;

create policy "Profiles are readable by their owner" on public.profiles
for select to authenticated using ((select auth.uid()) = id);
create policy "Profiles are editable by their owner" on public.profiles
for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Category presets are public" on public.categories_presets
for select to anon, authenticated using (true);

create policy "Categories belong to their owner" on public.categories
for all to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

-- The composite foreign key keeps categories on the same owner.
create policy "Entries belong to their owner" on public.entries
for all to authenticated
using ((select auth.uid()) = profile_id)
with check ((select auth.uid()) = profile_id);

create policy "Check-ins belong to their owner" on public.check_ins
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

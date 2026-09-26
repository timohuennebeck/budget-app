# Database plan

Target Supabase schema for Looop. It is based on:

- the current migrations in `supabase/migrations`
- `seed.sql` and `config.toml` (PG 17, `max_rows = 1000`)
- every `data/*-api.ts` file that touches the database

**Status:** steps 1–3 of [section 6](#6-implementation-order) are built (`supabase/migrations`). Steps 4–6 wait for RevenueCat, AI parsing and receipt photos. The product decisions in [section 7](#7-decisions) are settled.

**Nothing is deployed yet**, so the existing migrations are edited in place: no deprecated columns, no backfills, no follow-up "drop" migrations. The final schema is written as if it had always been this way.

---

## 1. Assessment of the current schema

### What stays

- **Ownership and deletion.** Every user-owned row references `profiles.id`, and `profiles.id` references `auth.users` with `on delete cascade`, so deleting the auth user removes all of that user's data.
- **Row-level security.** RLS is on for every table. Policies use the `(select auth.uid())` initplan pattern.
- **Helpers.** They live in the `private` schema with `search_path = ''`.
- **Money.** `numeric(12,2)` fits all 4 supported currencies (EUR, CHF, USD, GBP).
- **Legal tables.** `legal_documents`, `legal_acceptances` and `app_config` stay exactly as specified.

### Gaps

| #   | Issue                                                                                                                                                                 |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | **The free-entry limit exists only in the app.** RLS allows unlimited inserts, and the app counts by `created_at`, which the client can write.                        |
| R2  | **Nothing writes Plus status.** `profiles.plan` is a static enum with no expiry.                                                                                      |
| R3  | **The server doesn't know the user's time zone,** so it can't work out month or week boundaries.                                                                      |
| R4  | **`fetchEntryDates()` selects every entry.** `max_rows = 1000` cuts it off silently, which breaks streaks and counts past 1000 entries.                               |
| R5  | **`app_config` rows exist only in `seed.sql`,** which doesn't run in production.                                                                                      |
| R6  | **`handle_new_user` trusts sign-up metadata as-is,** including free-text currency and locale.                                                                         |
| R7  | **Missing checks:** currency and locale format, text lengths, a plausible `birth_date`, Monday-only `week_start`, `skipped ⇔ guess is null`, splits only on expenses. |
| R8  | **Missing indexes:** `legal_acceptances(document_id)`, `entries(profile_id, created_at)`, and favorites. `categories_profile_id_idx` is redundant.                    |
| R9  | **The client can write `legal_acceptances.accepted_at` and `entries.created_at`.**                                                                                    |
| R10 | **Deleting a category removes it from past entries.**                                                                                                                 |
| R11 | **Account deletion can't reach Storage (receipt photos) or RevenueCat.**                                                                                              |
| R12 | **The rating prompt state lives only on the device.**                                                                                                                 |
| R13 | **A check-in guess can be changed after the reveal.**                                                                                                                 |

---

## 2. Target tables

`profile_id` always means `uuid not null references public.profiles(id) on delete cascade`.

### `profiles`

```sql
first_name text not null default '' check (char_length(first_name) <= 50)
currency   text not null default 'EUR' check (currency ~ '^[A-Z]{3}$')
locale     text not null default 'en'  check (locale in ('en','de','es','fr','it','pt','pt-BR'))
time_zone  text not null default 'UTC'    -- IANA name; invalid names fall back to UTC
birth_date date check (birth_date between '1900-01-01' and current_date)
plus_expires_at timestamptz               -- written only by RevenueCat sync, see section 4
rating_prompted_at timestamptz            -- when we last asked for an App Store rating
-- budget_mode, monthly_budget, month_start_day, reminder_* unchanged
-- no `plan` column and no subscription_plan enum
```

- **Client-writable columns:** everything except `plus_expires_at`, `created_at` and `updated_at` (column grant).
- **`rating_prompted_at`:** the app asks for a rating once, after a few good days. This is currently remembered only on the phone, so a reinstall or a new phone asks again. Storing it on the profile fixes that. It is optional; drop it if asking again after a reinstall is fine.

### `categories`

```sql
name text not null check (char_length(name) between 1 and 40)
icon text not null check (char_length(icon) <= 40)
archived_at timestamptz                   -- soft delete, keeps past entries intact
unique (profile_id, key)
unique (id, profile_id)                   -- target for the entries composite FK
```

### `entries`

```sql
title text not null check (char_length(title) between 1 and 120)
total_amount numeric(12,2) check (total_amount >= amount)
capture_id uuid references public.captures(id) on delete set null
foreign key (category_id, profile_id)
  references public.categories (id, profile_id) on delete set null (category_id)
check (kind = 'expense' or total_amount is null)
index (profile_id, occurred_at desc)
index (profile_id, created_at)
index (profile_id) where is_favorite
index (category_id)
```

- **Composite FK:** it enforces same-owner categories, so the RLS policy doesn't need an `exists` subquery.
- **Insert grant:** `id, profile_id, category_id, kind, title, amount, total_amount, source, is_favorite, occurred_at, capture_id`.
- **Update grant:** `category_id, kind, title, amount, total_amount, is_favorite, occurred_at`.

### `check_ins` (renamed from `weekly_check_ins`)

```sql
id uuid pk, profile_id,
week_start date not null check (extract(isodow from week_start) = 1),
guess numeric(12,2), actual numeric(12,2),
skipped boolean not null default false check (skipped = (guess is null)),
expense_count int not null default 0 check (expense_count >= 0),
closeness numeric(4,3) generated always as (
  case when guess is null then null
       when actual is null or actual = 0 then case when guess = 0 then 1 else 0 end
       else greatest(0, 1 - abs(actual - guess) / actual) end) stored,
created_at,
unique (profile_id, week_start)
```

- **`closeness`:** 0–1, how near the guess landed ("93 % genau" in the UI). It mirrors `guessAccuracy()`.
- **No guess lock.** A user could edit a guess after the reveal, but it's a personal game, so it isn't worth a trigger.

### Legal and config tables

- **`legal_acceptances`:**
  - add an index on `document_id`
  - `accepted_at` defaults to `now()` and isn't in the insert grant, so the app can't set it
- **`app_config` keys:** inserted by a migration with `on conflict (key) do nothing`, not only by the seed.

| Key                    | Default             |
| ---------------------- | ------------------- |
| `free_entries`         | 15 per budget month |
| `ai_captures_free`     | 20 per day          |
| `ai_captures_plus`     | 200 per day         |
| `receipt_retention`    | 30 days             |
| `honor_sandbox`        | false               |
| `check_in_min_entries` | unchanged           |
| `check_in_close_ratio` | unchanged           |

### `entries_allowance`

```sql
profile_id uuid references profiles on delete cascade,
cycle_start date not null,
used int not null default 0 check (used >= 0),
primary key (profile_id, cycle_start)
```

This is the free-entry counter for the current budget month, one row per user per month. It exists because deleted entries still count (decision 2): counting rows in `entries` would free a slot on every delete.

The app can read its own rows and can't write any; only the entry trigger writes them.

### `captures` (AI parsing)

```sql
id uuid pk default gen_random_uuid(), profile_id,
source entry_source not null check (source <> 'manual'),
input_text text check (char_length(input_text) <= 2000),
receipt_path text,          -- 'receipts' bucket: '{profile_id}/{capture_id}.jpg'
status capture_status not null default 'pending',   -- pending | parsed | failed
result jsonb,               -- DraftEntry[] returned to the app
error_code text, model text, input_tokens int, output_tokens int, latency_ms int,
created_at timestamptz not null default now(), completed_at timestamptz,
check (source <> 'camera' or receipt_path is not null),
index (profile_id, created_at desc)
```

This table also counts the AI parses per day for `ai_captures_free` and `ai_captures_plus`.

---

## 3. Row-level security, and server vs. app logic

| Table             | App (`authenticated`)                 | Written by                            |
| ----------------- | ------------------------------------- | ------------------------------------- |
| profiles          | select and update own (column grants) | app, `handle_new_user`, Plus sync     |
| categories        | all own                               | app                                   |
| entries           | all own (column grants)               | app, limited by the allowance trigger |
| check_ins         | all own                               | app                                   |
| legal_documents   | select                                | migrations                            |
| legal_acceptances | select and insert own                 | app                                   |
| app_config        | select (never store secrets here)     | service role                          |
| entries_allowance | select own                            | the entry trigger                     |
| captures          | select own                            | `parse-capture` edge function         |

**Database functions.** All of them are trigger functions in the `private` schema, and the app never calls them directly. There are no RPCs.

| Function                      | Status   | Runs when                                                     |
| ----------------------------- | -------- | ------------------------------------------------------------- |
| `handle_new_user()`           | existing | a user signs up; creates the profile from cleaned-up metadata |
| `set_updated_at()`            | existing | a row with `updated_at` changes                               |
| `reject_legal_mutation()`     | existing | anyone tries to change a published legal document             |
| `enforce_entries_allowance()` | **new**  | an entry is inserted; see section 4                           |

Left out on purpose:

- **Small helpers** (`budget_cycle`, `has_plus`, `config_int`, time-zone checks) are inlined in `enforce_entries_allowance()`, their only caller.
- **Guess lock and `accepted_at` trigger:** handled by leaving the guess unlocked and by the column grant.
- **`get_entries_allowance()`:** the app reads its `entries_allowance` row, `plus_expires_at` and `free_entries` directly and does the subtraction. It already computes the budget month in `budgetCycle()`.
- **`entry_stats()`:** the app asks PostgREST for an exact count (`count: 'exact', head: true`) and fetches `occurred_at` for the last 60 days for the streak. Both stay far below the 1000-row limit.
- **`delete_own_account()`:** stays until the `delete-account` edge function (section 5) replaces it in step 6.

**Stays in the app:** overview and budget sums, check-in windows, formatting, local reminders.

---

## 4. Subscriptions and the free limit

**RevenueCat is the source of truth for purchases.** The app uses its SDK for the paywall, purchases, restores, and to show whether the user has Plus.

**The database stores only `profiles.plus_expires_at`.** The free limit has to be enforced where entries are written, which is Postgres. A Postgres trigger can't call RevenueCat's API, so the database keeps a copy of the one fact it needs: until when this user has Plus.

- **Edge function `revenuecat-webhook`:**
  - checks the `Authorization` header
  - fetches `GET /v1/subscribers/{app_user_id}`
  - writes the `plus` entitlement's expiry (or the grace period end) to `plus_expires_at`
  - fetching the full subscriber makes repeated or out-of-order events harmless, so no event log table is needed
- **Edge function `sync-entitlements`:** the app calls it right after a purchase or restore, so Plus works before the webhook arrives.
- **Identity:** the RevenueCat `app_user_id` is the Supabase user ID, set with `Purchases.logIn(userId)`.

**Free-limit trigger (BEFORE INSERT on `entries`):**

```text
new.created_at := now()
select month_start_day, time_zone, plus_expires_at from profiles
if plus_expires_at > now() then return new
cycle_start := start of the budget month in time_zone (UTC if the name is invalid)
limit := (select value from app_config where key = 'free_entries'), default 15
insert into entries_allowance values (profile_id, cycle_start, 1)
  on conflict do update set used = used + 1 where used < limit
  returning used
if no row: raise 'entry_limit_reached'
```

- **Atomic:** parallel inserts can't overshoot the limit.
- **Deletes still count:** deleted entries keep their slot; edits don't use one.
- **App side:** `use-entries-allowance.ts` reads the `entries_allowance` row, and the save path maps `entry_limit_reached` to `/limit`.

---

## 5. Storage and AI parsing

**Bucket `receipts`**

- **Settings:** private, 5 MiB, JPEG/PNG/WebP/HEIC.
- **Paths and policies:** files live under `{uid}/…`. Users can insert, read and delete only their own folder.
- **Retention:** a scheduled edge function deletes photos older than `receipt_retention` and clears `captures.receipt_path`. The parsed entries stay.

**Edge function `parse-capture`**

- **Reads:** the profile, the active categories and about 60 days of entries (as category hints).
- **Rate limit:** captures today against `ai_captures_free` or `ai_captures_plus`. Over the limit returns 429.
- **Writes:** the `captures` row, and returns `DraftEntry[]` plus `capture_id`.
- **Onboarding:** before sign-up the app keeps the local parser.
- **Voice:** transcription stays on the phone.

**Account deletion** moves to an edge function `delete-account`. It:

1. removes `receipts/{uid}/*`
2. deletes the RevenueCat subscriber
3. deletes the auth user

The cascade removes everything else.

---

## 6. Implementation order

Nothing is live, so this edits and adds migrations directly. Regenerate `database.types.ts` after each step.

| #   | Change                                                                                                                                                                                                                                                                                        | App files                                                                                                                                                                                                       |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **[done]** **Edit `initial_schema.sql`:** constraints, `time_zone`, `plus_expires_at` instead of `plan`, `rating_prompted_at`, `check_ins` with `closeness`, archived categories, composite FK, column grants, indexes, triggers. Fold in `restrict_profile_updates` and `default_locale_en`. | `check-ins-api.ts`, `use-check-ins.ts`, `check-in-window.ts`, `use-entries-allowance.ts`, `delete-account-screen.tsx`, `use-rating-prompt.ts`, category pickers (hide archived), sign-up metadata (`time_zone`) |
| 2   | **[done]** **Edit `app_config`:** key names above, inserted by the migration.                                                                                                                                                                                                                 | `use-app-config.ts`, `seed.sql`                                                                                                                                                                                 |
| 3   | **[done]** **New migration:** `entries_allowance` and `enforce_entries_allowance()`.                                                                                                                                                                                                          | `entries-api.ts`, `use-entries.ts`, `use-entries-allowance.ts`, `limit-screen.tsx`, `review-screen.tsx`, `complete-onboarding.ts`                                                                               |
| 4   | **[later]** **New:** `revenuecat-webhook` and `sync-entitlements` edge functions.                                                                                                                                                                                                             | `purchases.ts`, `auth-provider.tsx`                                                                                                                                                                             |
| 5   | **[later]** **New migration:** `captures`, `entries.capture_id`, the `receipts` bucket. **New:** `parse-capture` edge function.                                                                                                                                                               | `receipt-recognizer.ts`, `processing-screen.tsx`, `capture-store.ts`, `types.ts`                                                                                                                                |
| 6   | **[later]** **New:** `delete-account` edge function, which replaces the `delete_own_account` RPC.                                                                                                                                                                                             | `use-auth-actions.ts`                                                                                                                                                                                           |

---

## 7. Decisions

| Question                                                       | Decision                                                                                                                          |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Does Plus belong to the account on every platform?             | **Yes.** `app_user_id` = the Supabase user ID.                                                                                    |
| Do deleted entries still count towards the free limit?         | **Yes.** Edits don't use a slot.                                                                                                  |
| Are categories archived instead of deleted?                    | **Yes.** Archived categories stay on old entries.                                                                                 |
| How long are receipt photos kept?                              | **30 days.** The parsed entries stay.                                                                                             |
| AI parsing before sign-up, and daily caps?                     | **Local parser during onboarding;** after that, 20 a day free and 200 a day on Plus. Receipt scans count towards the entry limit. |
| Do sandbox and TestFlight purchases unlock Plus in production? | **No.** `honor_sandbox = false`, except for internal test builds.                                                                 |

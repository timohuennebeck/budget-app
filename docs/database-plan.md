# Database plan

Target Supabase schema for Looop, based on the current migrations in `supabase/migrations`, `seed.sql`, `config.toml` (PG 17, `max_rows = 1000`) and every `data/*-api.ts` file that touches the database.

**Status:** planned, not implemented. The product decisions in [section 7](#7-decisions) are settled.

---

## 1. Assessment of the current schema

### What stays

- **Ownership and deletion**
  - Every user-owned row references `profiles.id`, and `profiles.id` references `auth.users` with `on delete cascade`.
  - So `delete_own_account()` removes profiles, categories, entries, check-ins and acceptances.
- **Row-level security**
  - RLS is on for all 7 tables, and policies use the `(select auth.uid())` initplan pattern.
  - The entries policy checks that `category_id` belongs to the same owner.
- **Helpers:** they live in the `private` schema with `search_path = ''`, and `handle_new_user` is `security definer`.
- **Plan escalation:** `restrict_profile_updates` uses column-level `grant update`, so users can't set `plan = 'plus'` on themselves.
- **Money:** `numeric(12,2)` fits all 4 supported currencies (EUR, CHF, USD, GBP).
  - Don't switch to integer cents; every client file that handles amounts would break.
- **Unique constraints:** `weekly_check_ins (profile_id, week_start)` and `categories (profile_id, key)` match the client's upsert and dedupe logic.
- **Legal tables:** `legal_documents`, `legal_acceptances` and `app_config` stay exactly as specified. Documents are immutable through a trigger.

### Gaps and risks

| #   | Issue                                                                                                                                                                                                                                           | Where                                                                 |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| R1  | **The free-tier limit exists only in the client.** RLS allows unlimited inserts, and the client counts entries by `created_at`, a column the client can write. Changing `created_at`, or deleting and re-adding entries, gets around the limit. | `entries-api.ts countEntries`, `use-entry-allowance.ts`               |
| R2  | **`profiles.plan` is a static enum.** It has no expiry, trial, grace period or billing-issue state, and nothing writes to it.                                                                                                                   | initial schema, `use-entry-allowance.ts`, `delete-account-screen.tsx` |
| R3  | **Month and week boundaries exist only on the device** (`budgetCycle` and `weekRange` in `src/shared/lib/dates.ts`). The server doesn't know the user's time zone, so it can't enforce anything per cycle.                                      | `dates.ts`                                                            |
| R4  | **`fetchEntryDates()` selects every entry.** PostgREST `max_rows = 1000` cuts the result off silently, so streaks, the rating prompt and the counts on the delete-account screen go wrong past 1000 entries.                                    | `entries-api.ts`, `use-rating-prompt.ts`, `delete-account-screen.tsx` |
| R5  | **`app_config` rows exist only in `seed.sql`**, and seeds don't run in production.                                                                                                                                                              | `seed.sql`                                                            |
| R6  | **`handle_new_user` trusts `raw_user_meta_data` completely**, including free-text currency and locale. Once check constraints are added, bad metadata would make sign-up fail.                                                                  | initial schema, `default_locale_en`                                   |
| R7  | **Missing checks:** currency and locale format, text lengths, a plausible `birth_date`, Monday-only `week_start`, `skipped ⇔ guess is null`, and splits only on expenses.                                                                       |                                                                       |
| R8  | **Missing indexes:** `legal_acceptances(document_id)` (an FK), `entries(profile_id, created_at)`, and a favorites partial index. `categories_profile_id_idx` is redundant.                                                                      |                                                                       |
| R9  | **Clients can write `legal_acceptances.accepted_at` and `entries.created_at`.** Timestamps used as evidence should come from the server.                                                                                                        |                                                                       |
| R10 | **Deleting a category rewrites history.** Past entries lose their category. Categories also have no `updated_at`.                                                                                                                               |                                                                       |
| R11 | **The account-deletion cascade can't reach Storage objects** (future receipt images) or the RevenueCat subscriber.                                                                                                                              | `delete_own_account`                                                  |
| R12 | **The rating-prompt state lives only on the device** (zustand persist), so a reinstall asks again.                                                                                                                                              | `use-rating-prompt.ts`                                                |
| R13 | **Check-ins can be upserted again after the reveal**, which lets users rewrite a guess. Accuracy isn't stored.                                                                                                                                  |                                                                       |

---

## 2. Target tables

`profile_id` always means `uuid not null references public.profiles(id) on delete cascade`.

### New enums

```sql
entitlement_store  ('app_store','play_store','stripe','amazon','promotional','unknown')
entitlement_period ('trial','intro','normal','prepaid')
capture_status     ('pending','parsed','failed')
-- keep: platform, legal_doc_kind, budget_mode, entry_kind, entry_source, reminder_repeat
-- subscription_plan: dropped together with profiles.plan in the final migration
```

### `profiles` (altered)

```sql
first_name text not null default '' check (char_length(first_name) <= 50)
currency   text not null default 'EUR' check (currency ~ '^[A-Z]{3}$')
locale     text not null default 'en'  check (locale in ('en','de','es','fr','it','pt','pt-BR'))
time_zone  text not null default 'UTC'                -- NEW, IANA name, validated by trigger
birth_date date null check (birth_date between '1900-01-01' and current_date)
rating_prompted_at timestamptz null                   -- NEW (R12)
plan       -- deprecated: read-only until the client uses entitlements, then dropped
```

The update column grant also covers `time_zone` and `rating_prompted_at`.

### `categories` (altered)

```sql
name text not null check (char_length(name) between 1 and 40)
icon text not null check (char_length(icon) <= 40)
archived_at timestamptz null                          -- NEW: soft delete
updated_at timestamptz not null default now()         -- NEW + set_updated_at trigger
unique (id, profile_id)                               -- NEW: target for the composite FK
-- drop categories_profile_id_idx (covered by unique (profile_id, key))
```

### `entries` (altered)

```sql
title text not null check (char_length(title) between 1 and 120)
total_amount numeric(12,2) null check (total_amount >= amount)
capture_id uuid null references public.captures(id) on delete set null   -- migration 4
foreign key (category_id, profile_id)
  references public.categories (id, profile_id) on delete set null (category_id)
check (kind = 'expense' or total_amount is null)
index (profile_id, occurred_at desc)   -- keep
index (profile_id, created_at)         -- NEW
index (profile_id) where is_favorite   -- NEW
index (category_id)                    -- keep
index (capture_id) where capture_id is not null
```

- The composite FK enforces same-owner categories, so the `exists` subquery in the RLS policy can go.
- Column grants replace the table-wide grants:
  - **Insert:** `id, profile_id, category_id, kind, title, amount, total_amount, source, is_favorite, occurred_at, capture_id`
  - **Update:** `category_id, kind, title, amount, total_amount, is_favorite, occurred_at`

### `weekly_check_ins` (altered)

```sql
expense_count int not null default 0 check (expense_count >= 0)
accuracy numeric(4,3) generated always as (
  case when guess is null then null
       when actual is null or actual = 0 then case when guess = 0 then 1 else 0 end
       else greatest(0, 1 - abs(actual - guess) / actual) end) stored
updated_at timestamptz not null default now()
check (extract(isodow from week_start) = 1)
check (skipped = (guess is null))
```

- The generated `accuracy` column mirrors `guessAccuracy()`.
- The trigger `private.lock_check_in_guess` rejects changes to `guess` or `skipped` once they are set. `actual` can still change.

### Legal and config tables (structure unchanged)

- **`legal_acceptances`:**
  - add an index on `document_id`
  - a BEFORE INSERT trigger forces `accepted_at = now()`
  - clients can no longer write `accepted_at`
- **`app_config`:** a migration inserts the required keys with `on conflict (key) do nothing`, so production has them. The keys are:
  - `free_monthly_entries`
  - `check_in_min_entries`
  - `check_in_close_ratio`
  - `ai_daily_captures_free` (20)
  - `ai_daily_captures_plus` (200)
  - `receipt_retention_days` (30)
  - `honor_sandbox` (false)

### `entitlements` (new)

```sql
profile_id uuid references profiles on delete cascade,
entitlement text not null check (entitlement in ('plus')),
product_id text not null,
store entitlement_store not null,
period_type entitlement_period not null,
is_sandbox boolean not null default false,
purchased_at timestamptz, original_purchased_at timestamptz,
expires_at timestamptz,                 -- null = lifetime / promotional
grace_period_expires_at timestamptz,
will_renew boolean not null default false,
billing_issue_detected_at timestamptz,
unsubscribe_detected_at timestamptz,
rc_last_event_id text, rc_synced_at timestamptz not null default now(),
created_at, updated_at,
primary key (profile_id, entitlement)
```

### `private.revenuecat_events` (new, not exposed)

```sql
event_id text primary key,              -- RevenueCat event.id, for idempotency
app_user_id text not null, type text not null, environment text not null,
event_at timestamptz not null, payload jsonb not null,
received_at timestamptz not null default now(), processed_at timestamptz, error text
index (app_user_id, event_at desc)
```

### `private.entry_usage` (new)

```sql
profile_id uuid references profiles on delete cascade,
cycle_start date not null,
used int not null default 0 check (used >= 0),
primary key (profile_id, cycle_start)
```

### `captures` (new, AI parsing)

```sql
id uuid pk default gen_random_uuid(), profile_id,
source entry_source not null check (source <> 'manual'),
input_text text check (char_length(input_text) <= 2000),
receipt_path text,          -- 'receipts' bucket: '{profile_id}/{capture_id}.jpg'
status capture_status not null default 'pending',
result jsonb,               -- DraftEntry[] as returned to the client
error_code text, model text, input_tokens int, output_tokens int, latency_ms int,
created_at timestamptz not null default now(), completed_at timestamptz,
check (source <> 'camera' or receipt_path is not null),
check (receipt_path is null or receipt_path like profile_id::text || '/%')
index (profile_id, created_at desc)
```

---

## 3. Row-level security, and server vs. client logic

| Table             | Client (`authenticated`)                                           | Written by                               |
| ----------------- | ------------------------------------------------------------------ | ---------------------------------------- |
| profiles          | select own; update own through column grants (not `plan`)          | client, `handle_new_user`                |
| categories        | all own                                                            | client                                   |
| entries           | all own; column grants; the composite FK checks category ownership | client, limited by the allowance trigger |
| weekly_check_ins  | all own; guess-lock trigger                                        | client                                   |
| legal_documents   | select (anon + authenticated)                                      | migrations / service role                |
| legal_acceptances | select own, insert own; `accepted_at` set by the server            | client                                   |
| app_config        | select (anon + authenticated); never store secrets here            | service role                             |
| entitlements      | **select own only**                                                | service role (edge functions)            |
| captures          | **select own only**                                                | `parse-capture` edge function            |
| `private.*`       | no grants                                                          | security definer functions               |

Every new table that only the server writes gets `revoke all ... from anon, authenticated` right after `create table`. Supabase's default privileges grant everything, so RLS would otherwise be the only safeguard.

**`private` functions and triggers**

- `handle_new_user()`: cleans up the sign-up metadata.
  - An unknown locale falls back to `'en'`.
  - Currency and `time_zone` are checked the same way.
  - `first_name` is truncated.
- `budget_cycle(month_start_day, tz, at)`: the SQL twin of `budgetCycle()`, computed in the profile's time zone.
- `has_plus(uid)`: true if there is a `plus` entitlement whose `coalesce(grace_period_expires_at, expires_at)` is null or in the future. Sandbox purchases count only when `honor_sandbox` is on.
- `enforce_entry_allowance()`: see [section 4](#4-subscriptions-and-the-free-limit).
- `lock_check_in_guess()`, `force_accepted_at()`, `set_updated_at()`.
  - `set_updated_at()` already exists; attach it to categories, check-ins and entitlements.
- `config_int(key, default)` and `config_bool(key, default)`: read `app_config` with built-in fallbacks.

**Public RPCs**

- `get_entry_allowance()`: returns `unlimited, limit, used, remaining, cycle_start, cycle_end`.
  - It replaces `countEntries` and the arithmetic in `use-entry-allowance.ts`.
- `entry_stats()`: returns the total count and the active days in the profile's time zone, for the last 400 days.
  - It replaces `fetchEntryDates` (R4).
- `pending_legal_documents(locale)`: for a future re-consent gate.
- `apply_revenuecat_subscriber(uid, subscriber, event_id)` and `record_revenuecat_event(payload)`: callable by `service_role` only.

**Stays on the client:** overview and budget aggregation, check-in windows and `actual`, formatting, and local reminders.

---

## 4. Subscriptions and the free limit

**Identity.** The Supabase `auth.uid()` is the RevenueCat `app_user_id`, set with `Purchases.logIn(userId)` in `auth-provider.tsx`. Plus follows the account across platforms.

**Edge function `revenuecat-webhook`** (`verify_jwt = false`)

1. Check the `Authorization` header against `REVENUECAT_WEBHOOK_SECRET`.
2. Record the event with `on conflict do nothing`. A duplicate returns 200.
3. Fetch `GET /v1/subscribers/{app_user_id}` and apply the full `plus` entitlement, instead of applying event deltas. The result is then the same whatever order events arrive in.
4. For `TRANSFER` events, sync both the old and the new user.
5. Log `app_user_id`s that don't match a profile as errors.
6. Always return 200 after recording. Failed events can be replayed from the table.

**Edge function `sync-entitlements`** (user JWT): the client calls it right after a purchase or restore. This closes the gap before the webhook arrives.

**Free-limit enforcement** (a BEFORE INSERT trigger on `entries`):

```text
new.created_at := now()
if has_plus(new.profile_id) then return new
cycle := budget_cycle(month_start_day, time_zone, now())
lim   := config_int('free_monthly_entries', 15)
insert into private.entry_usage values (profile_id, cycle.start_date, 1)
  on conflict do update set used = used + 1 where used < lim
  returning used
if no row: raise 'entry_limit_reached' (detail: limit, cycle_end)
```

- The counter update is atomic, so parallel inserts can't overshoot the limit.
- A batch that crosses the limit fails as a whole, which matches `canAdd(count)`.
- **Deleted entries keep counting.** The counter never goes down, so delete-and-re-add doesn't get around the limit. Editing an entry doesn't use a slot.
- The service role bypasses the trigger (`auth.uid()` is null), for support fixes and the seed.

**Client changes**

- `use-entry-allowance.ts` calls `get_entry_allowance()` and a new `useEntitlement()` hook, instead of reading `profile.plan`.
- The capture save path maps `entry_limit_reached` to `/limit`.

---

## 5. Storage and AI parsing

**Bucket `receipts`**

- **Settings:** private, 5 MiB, JPEG/PNG/WebP/HEIC.
- **Created in a migration**, and mirrored in `config.toml` as `[storage.buckets.receipts]`.
- **Path:** `{uid}/{capture_id}.jpg`.
- **Policies:** insert, select and delete when `(storage.foldername(name))[1] = auth.uid()::text`. No update.
- **Client:** downsizes the image to about 1600 px before upload. This needs `expo-image-manipulator`.
- **Retention:** a scheduled edge function deletes images older than `receipt_retention_days` (30) and sets `captures.receipt_path = null`. The parsed entries stay.

**Edge function `parse-capture`** (replaces `receipt-recognizer.ts` and the parser call in `processing-screen.tsx`)

- **Input:** `{ source, text?, receipt_path?, client_now }`.
- **Reads with the user's JWT:**
  - the profile (currency, locale, time zone, name)
  - categories that aren't archived
  - about 60 days of entries, as merchant-to-category hints
  - the allowance
- **Rate limit:** captures today, in the profile's time zone, against `ai_daily_captures_free` (20) or `ai_daily_captures_plus` (200). Over the limit returns 429.
- **Writes with the service role:** the `captures` row, the result, and usage and latency.
- **Output:** the existing `DraftEntry[]` shape plus `capture_id`.
- **Onboarding:** before sign-up it keeps the local `parseEntries` parser.
- **Voice:** transcription stays on the device, so no audio is stored.
- **Secrets:** the LLM key and `REVENUECAT_API_KEY` are edge function secrets, never `app_config`.

**Account deletion** moves to an edge function `delete-account` (JWT). It:

1. removes `receipts/{uid}/*`
2. calls RevenueCat `DELETE /v1/subscribers/{uid}`
3. calls `auth.admin.deleteUser(uid)`

The cascade deletes everything else. The old RPC stays until the client has switched.

---

## 6. Migrations, in order

| #   | File                              | Contents                                                                                                                                                                                                                                                                                                                                                                                                                 | Client impact                                                                                                                                                                                                                                                                                |
| --- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `…_harden_constraints.sql`        | Profile checks, `time_zone`, `rating_prompted_at`, cleaned-up `handle_new_user`; category `archived_at`, `updated_at`, composite-FK target, drop the redundant index; entry checks, composite FK, simpler policy, column grants, indexes; check-in checks, `expense_count`, `accuracy`, guess lock; acceptance index and forced `accepted_at`; `app_config` keys. Check existing data against the new constraints first. | Non-breaking. Regenerate `database.types.ts`. Send `time_zone` from `expo-localization` (`auth-provider.tsx`, `use-profile.ts`, sign-up metadata) and `expense_count` from the guess screen. Hide archived categories in pickers and budgets.                                                |
| 2   | `…_entitlements.sql`              | Enums, `entitlements`, `private.revenuecat_events`, `has_plus`, service-role RPCs. Backfill `plan = 'plus'` as a `promotional` entitlement.                                                                                                                                                                                                                                                                              | Non-breaking. New `paywall/data/entitlements-api.ts` and `useEntitlement`; switch `use-entry-allowance.ts` and `delete-account-screen.tsx` away from `plan`. The real `purchases.ts` and the webhook and sync functions.                                                                     |
| 3   | `…_entry_allowance_and_stats.sql` | `budget_cycle`, `config_int`, `entry_usage` (backfilled from the current cycle), the allowance trigger, `get_entry_allowance()`, `entry_stats()`.                                                                                                                                                                                                                                                                        | **Behaviour change:** inserts over the limit fail. Update `entries-api.ts`, `use-entries.ts`, `use-entry-allowance.ts`, `limit-screen.tsx`, `use-rating-prompt.ts`, `delete-account-screen.tsx`, `review-screen.tsx`, and `complete-onboarding.ts` (cap the onboarding drafts at the limit). |
| 4   | `…_captures_and_receipts.sql`     | `capture_status`, `captures`, `entries.capture_id`, the `receipts` bucket and its policies.                                                                                                                                                                                                                                                                                                                              | Non-breaking. `receipt-recognizer.ts`, `processing-screen.tsx`, `capture-store.ts`, `types.ts`, and the `parse-capture` function.                                                                                                                                                            |
| 5   | `…_account_deletion_edge.sql`     | Revoke or drop `delete_own_account`. Ship only after the app release that uses the edge function.                                                                                                                                                                                                                                                                                                                        | **Breaking:** `useDeleteAccount` has to call `functions.invoke('delete-account')`.                                                                                                                                                                                                           |
| 6   | `…_drop_profile_plan.sql`         | Drop `profiles.plan` and `subscription_plan` once no supported build reads them.                                                                                                                                                                                                                                                                                                                                         | **Breaking** for old builds. Regenerate the types.                                                                                                                                                                                                                                           |

`seed.sql`: add `time_zone = 'Europe/Berlin'` to the demo profile, optionally add a promotional Plus entitlement for a second demo user, and use `on conflict do nothing` for the `app_config` inserts.

---

## 7. Decisions

| Question                                                       | Decision                                                                                                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Does Plus belong to the account on every platform?             | **Yes.** `app_user_id` = the Supabase user ID. A restore on another account moves the subscription.                                               |
| Do deleted entries still count towards the free monthly limit? | **Yes.** The counter never goes down; editing doesn't use a slot.                                                                                 |
| Are categories archived instead of deleted?                    | **Yes.** Archived categories are hidden from pickers and budgets but stay on old entries.                                                         |
| How long are receipt photos kept?                              | **30 days.** After that the image is deleted and the parsed entry stays.                                                                          |
| AI parsing before sign-up, and daily caps?                     | **Local parser during onboarding.** After sign-up: 20 AI parses a day on the free tier, 200 on Plus. Receipt scans count towards the entry limit. |
| Do sandbox and TestFlight purchases unlock Plus in production? | **No.** `app_config.honor_sandbox = false`; turn it on only for internal test builds.                                                             |

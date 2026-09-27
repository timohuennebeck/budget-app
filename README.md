# Looop

Expense tracker where you just say or type what you spent and Pip sorts it into categories. Built with Expo (SDK 57, Expo Router), Supabase and Tailwind via [Uniwind](https://uniwind.dev).

## Getting started

```bash
npm install
cp .env.example .env.local   # values for the local Supabase stack
npm run db:start             # starts Supabase in Docker, applies migrations + seed
npm start                    # Expo dev server (press i / a)
```

`npm run db:start` prints the API URL and the publishable key; if they differ from `.env.example`, update `.env.local`. The seed creates a demo account: **timo@mail.de / looop1234**.

The app uses native modules (camera, notifications, native tabs), so run it in a development build (`npx expo run:ios` / `run:android`) rather than Expo Go.

## Scripts

| Script                               | What it does                                                    |
| ------------------------------------ | --------------------------------------------------------------- |
| `npm start`                          | Expo dev server                                                 |
| `npm run lint` / `npm run typecheck` | ESLint (expo config + prettier) / TypeScript                    |
| `npm run format`                     | Prettier (with the Tailwind class sorter)                       |
| `npm run db:start` / `db:stop`       | Local Supabase stack                                            |
| `npm run db:reset`                   | Re-apply migrations and `supabase/seed.sql`                     |
| `npm run db:types`                   | Regenerate `src/shared/lib/database.types.ts` from the local DB |

## Project structure

```
src/
  app/                 Expo Router routes only (thin files that render feature screens)
    (onboarding)/      Welcome → name → currency → first entry → … → sign-up → Plus → done
    (app)/             Signed-in app: native tabs + capture, entry, check-in, settings
    legal/[kind].tsx   Terms / privacy from the legal_documents table
  features/<feature>/  components · hooks · lib · data per feature
  shared/              ui (primitives) · components (composed) · lib · hooks · data · i18n
plugins/               Expo config plugins (Action Button App Intent)
supabase/
  migrations/          Schema, RLS policies, triggers, cron jobs
  functions/           Edge functions: parse-capture, send-notifications
  presets/             Generator for the categories_presets migration
  seed.sql             Demo account (local only, never run against the hosted project)
```

Routing: `src/app/_layout.tsx` uses `Stack.Protected`. The onboarding group stays available until the profile has `onboarded_at`, so the post-sign-up steps (Plus, done) still work; after that only the app group is reachable.

## Data model

`profiles` (1:1 with `auth.users`, created by trigger) · `categories_presets` (39 built-in categories with names and parser keywords in all 7 languages, readable before sign-up) · `categories` (only the ones users create themselves) · `categories_limits` (monthly limit per preset or own category) · `entries` (point at a preset via `preset_id` or an own category via `category_id`) · `entries_allowance` (free entries per budget month, enforced by trigger) · `captures` (every AI request; the daily AI limit) · `check_ins` · `notifications`, `notifications_templates`, `notifications_settings`, `push_tokens` · `legal_documents` / `legal_acceptances` · `app_config` (limits, prices, AI model, …). Every user table is protected by row level security on `auth.uid()`.

## AI capture and voice

- **Text, voice, receipts** – `parse-capture` sends the note or photo to OpenAI (`app_config.ai_model`, Responses API with a strict JSON schema). Typed and spoken text fall back to the on-device parser (`features/capture/lib/parse-entries.ts`) when the function fails; before sign-up only the on-device parser runs.
- **Voice** – the app records on the device (`expo-audio`) and sends the file to `parse-capture`, which transcribes it with OpenAI (`app_config.stt_model`) and parses the text like a typed note.
- **Limits** – `ai_captures_free` / `ai_captures_plus` per rolling 24 hours, counted in `captures`.

## Notifications

pg_cron runs `private.dispatch_notifications()` every 5 minutes: it queues due reminders and check-ins, and calls `send-notifications`, which delivers queued rows through Expo push. Budget and limit warnings are queued by a trigger on `entries`. Texts live in `notifications_templates`.

## Hosted project setup (once)

1. Edge function secrets: `OPENAI_API_KEY` (and optionally `EXPO_ACCESS_TOKEN`).
2. Vault secrets used by the cron job (SQL editor):
   ```sql
   select vault.create_secret('https://<ref>.supabase.co', 'project_url');
   select vault.create_secret('<random string>', 'notifications_cron_secret');
   ```
3. Push tokens need an EAS project id: run `npx eas-cli init` once.
4. Authentication › Sign In / Providers: turn on **anonymous sign-ins** (AI capture during onboarding) and turn off **Confirm email** under Email.
5. Enable leaked password protection under Authentication › Settings.

## Still to come

- **Purchases** – `features/paywall/lib/purchases.ts` is where RevenueCat plugs in.
- **Widget** – onboarding explains it; the native widget extension is not built yet.
- **Receipt clean-up** – photos stay in the `receipts` bucket until a retention job exists.

## Conventions

See [AGENTS.md](./AGENTS.md).

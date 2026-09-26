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
supabase/
  migrations/          Schema, RLS policies, triggers
  seed.sql             App config, placeholder legal documents, demo account
```

Routing: `src/app/_layout.tsx` uses `Stack.Protected`. The onboarding group stays available until the profile has `onboarded_at`, so the post-sign-up steps (Plus, done) still work; after that only the app group is reachable.

## Data model

`profiles` (1:1 with `auth.users`, created by trigger) · `categories` (built-ins carry a `key` and are translated in the app) · `entries` (`amount` is the user's share; `total_amount` keeps split bills) · `weekly_check_ins` · `legal_documents` (immutable, versioned per locale) · `legal_acceptances` · `app_config` (free entry limit, prices, peer averages, …). Every user table is protected by row level security on `auth.uid()`.

## Stubs to replace later

- **AI parsing** – `features/capture/lib/parse-entries.ts` is an on-device parser with the signature a backend (Edge Function / LLM) parser would have.
- **Receipt OCR** – `features/capture/lib/receipt-recognizer.ts` returns a sample receipt.
- **Speech recognition** – `features/capture/hooks/use-voice-transcript.ts` simulates dictation.
- **Purchases** – `features/paywall/lib/purchases.ts` is where RevenueCat plugs in.
- **Widget / Action Button** – onboarding explains them; the native widget and App Intent are not built yet.

## Conventions

See [AGENTS.md](./AGENTS.md).

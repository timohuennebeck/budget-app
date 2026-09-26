# Plan: AI capture, live transcription, hosted Supabase

What's left to make capture fully work, in the order I'd build it. Each step ends with type-check, lint, Prettier, the tests named in that step, a commit and a push to `main`.

**Already done:** split bills (halbe-halbe) are removed everywhere (commit `refactor: remove split bills`).

---

## 1. AI parsing: `parse-capture` edge function with a provider adapter

**Goal:** typed text, spoken text and receipt photos become entries with the right category, parsed by OpenAI on the server.

**Database** (new migration `…_captures.sql`, drafted but not committed):

- A `captures` table logging every AI request: source, input text or receipt path, status, result, provider, model, tokens, latency.
  - The app can only read its own rows; only the function writes.
- `entries.capture_id` records which capture an entry came from.
- A private `receipts` storage bucket (5 MB, images only). Users can upload, read and delete only in their own folder.
- New `app_config` keys:
  - `ai_provider` = `openai`
  - `ai_model` = `gpt-6-luna`: $0.10 / $0.50 per million input / output tokens, about $0.0004 per capture. Switching to `gpt-6-sol` is a config change.

**Edge function** `supabase/functions/parse-capture/`:

- `index.ts`:
  - checks the user's login and reads their profile, active categories and last 60 days of entries (as merchant hints)
  - enforces the daily AI limit (`ai_captures_free` 20, `ai_captures_plus` 200, over a rolling 24 hours)
  - writes the `captures` row and calls the provider
  - validates the result: amounts above 0, category IDs that really exist, no dates in the future
- `providers/types.ts`: one interface, `parse({ text | image, categories, hints, currency, locale, now }) → entries + token usage`.
- `providers/openai.ts`:
  - uses the Responses API with structured outputs (strict JSON schema)
  - `category_id` may only be one of the user's category IDs or null, so the model can't invent categories
  - receipt photos are sent as base64 images, which also works in local development
- `prompt.ts`: instructions and schema, shared by all providers. Adding Anthropic later means one new file, `providers/anthropic.ts`.

**App:**

- `capture/data/capture-api.ts`:
  - uploads the receipt photo to `receipts/{userId}/{captureId}.jpg`
  - calls the function with `supabase.functions.invoke`
- The processing screen uses the server when signed in:
  - **Text and voice:** if the server fails (offline, limit reached, error), fall back to the current on-device parser, so capture always works.
  - **Receipts:** there is no offline fallback, so an error shows the existing "Das hat nicht geklappt" screen.
- Removes the fake receipt placeholder (`receipt-recognizer.ts`).
- Drafts carry `captureId`, which is saved as `entries.capture_id`.

**Tests:**

- Database: PGlite tests for the new table, grants and storage rules.
- The OpenAI adapter against a mock server: request shape, schema, parsing the response, handling errors.
- The app on web with a mocked function.
- I can't test against the real OpenAI API without a key.

---

## 2. Live transcription with OpenAI Realtime

**Goal:** the most accurate live transcription. Words appear as the user speaks, transcribed by OpenAI and not by the phone.

**How it works:**

1. **Session:** the voice screen asks a new edge function, `transcribe-session`, for a short-lived OpenAI token. The real API key never reaches the phone. The function:
   - checks the login and the daily AI limit (a voice session counts as one capture)
   - logs the session in `captures` (source `voice`)
   - creates a transcription-only Realtime session with the model from `app_config.stt_model` and the app language as a hint
2. **Streaming:** the phone connects to OpenAI directly over **WebRTC** (`react-native-webrtc` with its Expo config plugin).
   - WebRTC captures and streams the microphone itself, so there's no raw audio handling in JavaScript.
   - Transcript pieces arrive over the WebRTC data channel and appear live on screen.
3. **Stop:** the final transcript goes through `parse-capture` (step 1) and on to review.

**Model:** `app_config.stt_model`. I'll use OpenAI's current live transcription model; third-party pages call it `gpt-live-transcribe`, at about $0.017 per minute, or about $0.004 for a 15-second capture. I couldn't confirm the name or price on OpenAI's own site from here, so it's a setting you can correct without a code change.

**Limits and errors:**

- A session stops itself after 60 seconds (`app_config.voice_max_seconds`), so a forgotten open microphone can't run up costs.
- **Microphone permission** (texts for iOS and Android via the plugins): if denied, a short message, a button to Settings, and a fallback to typing.
- **No network, no key, or daily limit reached:** a message plus a fallback to typing. There's no on-device speech fallback, because you want the most accurate option only.
- **Web:** uses the browser's built-in WebRTC, so the same code path works for testing.

**App changes:**

- Replace the simulated `use-voice-transcript.ts` with a `useLiveTranscription()` hook. It manages the connection, partial and final text, and the timer.
- The screen's highlighting of amounts stays.
- Remove the `voiceSample` strings from all 7 languages.

**Tests:**

- The session function against a mocked OpenAI.
- The hook's handling of transcript events, with fake data-channel messages.
- Type-check, lint and web.

**Risk:** OpenAI's API docs are blocked from this environment, so I'll build against the Realtime API as I know it: client secrets, WebRTC calls, and the `input_audio_transcription` delta/completed events. If anything was renamed, it fails on the first real test. Everything OpenAI-specific stays in one adapter file, so a fix is small. To remove that risk, allow `developers.openai.com` in this environment's network settings before you go to bed, and I'll check against the current docs.

---

## 3. Category catalogue in the database

**Goal:** every category a budgeting app needs lives in one table, instead of the 12 hard-coded in the app today.

**Table `categories_presets`** (anyone can read it, including before sign-up; only migrations write it):

```sql
key text primary key,            -- 'groceries'
group_key text not null,         -- 'food', 'transport', …
names jsonb not null,            -- {"en": "Groceries", "de": "Lebensmittel", …} all 7 languages
keywords jsonb not null,         -- {"de": ["rewe", "edeka", "lidl"], "en": [...], …} for the parser and the AI
icon text not null,              -- Phosphor icon name
hue smallint not null,
peer_average numeric(12,2),      -- "Ø 290 € bei Gleichaltrigen"; replaces app_config.peer_averages
suggested boolean not null default false,   -- pre-selected in onboarding
sort_order integer not null
```

- A user's own categories keep one row each in `categories`. `categories.key` becomes `preset_key`, pointing at `categories_presets`. Custom categories have none.
- **Single source:** the app no longer bundles the catalogue. Onboarding, "Kategorie erstellen" suggestions, the on-device parser and the AI prompt all read the table, which react-query caches.
- The translated category names move out of the 7 locale files into `names`.

**Proposed presets: 38 in 11 groups.** Existing keys stay the same.

| Group         | Presets                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Food & drink  | groceries (Lebensmittel)_, dining (Essen gehen)_, cafe (Café)*, takeaway (Lieferdienst), bars (Bars & Ausgehen)                            |
| Transport     | transport (Mobilität / ÖPNV & Taxi)*, fuel (Tanken), parking (Parken), car (Auto & Werkstatt)                                              |
| Housing       | housing (Miete & Wohnen), utilities (Strom & Gas), internet_phone (Internet & Handy), home (Haushalt & Einrichtung)                        |
| Shopping      | shopping (Shopping)*, clothing (Kleidung & Schuhe), electronics (Elektronik), drugstore (Drogerie), gifts (Geschenke)                      |
| Health & body | health (Gesundheit & Apotheke), fitness (Fitness & Sport), beauty (Friseur & Beauty)                                                       |
| Leisure       | leisure (Freizeit), subscriptions (Abos & Streaming), events (Konzerte & Events), hobbies (Hobbys), books (Bücher & Medien), games (Games) |
| Travel        | travel (Reisen), hotels (Hotels & Unterkünfte)                                                                                             |
| Family & pets | kids (Kinder), pets (Haustiere), education (Bildung & Kurse)                                                                               |
| Finance       | insurance (Versicherungen), fees (Bankgebühren), taxes (Steuern), loans (Kredite & Raten), donations (Spenden)                             |
| Work          | work (Arbeit & Büro)                                                                                                                       |
| Other         | other (Sonstiges)                                                                                                                          |

\* pre-selected in onboarding, as in the design today.

- **Income** keeps no category, as in the design. Income categories (salary, freelance, refunds) can be added the same way later.
- Each preset gets names in all 7 languages, 5–15 keywords per language (common chains and merchants in DE/AT/CH, ES, FR, IT, PT/BR, UK/US), an icon, a hue from the design palette and a peer average.

---

## 4. Notifications sent to the user

**Goal:** every notification Looop sends goes through the server and is recorded in one table. Nothing is scheduled on the phone any more.

**Table `notifications`**, one row per notification to a user:

```sql
id uuid primary key,
profile_id uuid references profiles on delete cascade,
kind notification_kind not null,   -- 'daily_reminder' | 'check_in_open' | 'check_in_closing'
                                   -- | 'budget_warning' | 'budget_exceeded' | 'limit_almost_reached'
title text not null,               -- already in the user's language
content text not null,
data jsonb not null default '{}',  -- deep link, e.g. {"url": "looop://capture"}
status notification_status not null default 'queued',  -- queued | sent | failed | skipped
scheduled_for timestamptz not null,
sent_at timestamptz, opened_at timestamptz, error text,
created_at timestamptz not null default now(),
unique (profile_id, kind, scheduled_for)   -- never the same reminder twice
```

- **Access:** users can read their own rows and set `opened_at`; only the server creates and sends them.

**Table `notifications_templates`**: the title and text of every notification, per kind and language, editable in Supabase without an app release:

```sql
kind notification_kind not null,
locale text not null,              -- 'en', 'de', … (all 7)
title text not null,               -- 'Wochen-Check-in ist offen'
content text not null,                -- 'Was schätzt du, {{name}}? Pip hat nachgezählt.'
url text,                          -- deep link, e.g. 'looop://check-in'
active boolean not null default true,   -- switch a kind off without code
updated_at timestamptz not null default now(),
primary key (kind, locale)
```

- **Placeholders:** `{{name}}`, `{{category}}`, `{{percent}}` and `{{remaining}}` are filled in when queueing. A missing language falls back to English.
- **Access:** anyone signed in can read it; only migrations and the service role write it.
- **Initial texts:** a migration inserts them for all 6 kinds in all 7 languages, in the app's voice ("Heute schon was ausgegeben?").

**Supporting tables:**

- `notification_settings`: one row per user and kind, with on/off, time and repeat. It replaces the three reminder columns on `profiles`, and the sign-up trigger creates the rows.
- `push_tokens`: the phone's Expo push token, saved after login.

**How they get sent:**

1. **Queueing:**
   - A `pg_cron` job runs every 5 minutes and queues everything due, using each user's time zone and settings: the daily reminder at their time, the check-in on Sunday 18:00 and Monday morning.
   - Budget and limit notifications are queued by a trigger when an entry pushes a category over 80 % or 100 %, or leaves 3 free entries.
2. **Sending:** an edge function, `send-notifications`, sends the queued rows through Expo's push service (which delivers to Apple and Google) and marks each row `sent` or `failed`. Invalid tokens are deleted.
3. **Texts:** from `notifications_templates` (see below), rendered in the user's language. The row keeps the exact text that was sent.
4. **Tapping:** opening a notification sets `opened_at` and follows the deep link.

**Settings screen:** Profil › Erinnerung stays as designed, plus switches for "Wochen-Check-in" and "Budget-Warnungen" in the same style.

**What you need to do:** push notifications need an EAS project. Run `npx eas-cli init` once in the repo, which adds the project ID to `app.json`. Until then the app can't get a push token, so rows are queued and marked `skipped`, which is still testable.

---

## 5. Action Button (iOS)

**Goal:** the onboarding promise works. In Settings › Action Button › Shortcut, the user picks "Looop: Ausgabe erfassen", and pressing the button opens Looop straight in voice capture.

- A small **Expo config plugin** in `plugins/with-capture-intent.js` adds one Swift file, `CaptureExpenseIntent.swift`, to the iOS app during prebuild:
  - an `AppIntent` with `openAppWhenRun = true` that opens `looop://capture/voice`
  - an `AppShortcutsProvider` so the shortcut appears automatically, with the title in all 7 languages
- The app handles `looop://capture/voice`. When signed in, it goes to voice capture; during onboarding, it goes to the capture step.
- **Android** has no Action Button. The onboarding step is iOS-only already.
- **Risk:** I can't build or run iOS here, so the Swift file and plugin are untested until your first development build. The file is short, and a compile error there is quick to fix.
- **Widget:** still later. A widget needs a separate app extension and shared storage between app and widget, which is much more than the Action Button.

---

## 6. Hosted Supabase project (`budget-app`, eu-west-1)

1. Apply all migrations (schema, entries allowance, captures, category presets, notifications) and enable `pg_cron` through the Supabase connector. **No seed:** it contains the demo account and its password.
2. Deploy `parse-capture`, `transcribe-session` and `send-notifications` through the connector.
3. Regenerate `database.types.ts` from the hosted schema and compare it with my hand-written version.
4. Run the connector's security and performance checks and fix anything they flag.

**What you need to do once:** add the OpenAI key as a Supabase secret, either in the dashboard (Edge Functions → Secrets → `OPENAI_API_KEY`) or with `supabase secrets set OPENAI_API_KEY=…`. Until then both functions answer with an error: typed text falls back to the on-device parser, and voice falls back to typing.

---

## 7. Review

Same as the first build: a code-simplifier pass and a code-reviewer pass as subagents over everything changed tonight, then fixes, re-verification and a push. I'll also refresh the design comparison page if screens changed.

---

## Decisions I'll make unless you say otherwise

| Question                              | Default                                                                                                                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model                                 | `gpt-6-luna` for text and receipts (your choice); `ai_model` switches it.                                                                                                           |
| Transcription                         | OpenAI Realtime only, with no on-device fallback. If it's unavailable, the app falls back to typing.                                                                                |
| One receipt =                         | One entry: shop name and total, with the category guessed from the shop.                                                                                                            |
| AI during onboarding (before sign-up) | Not yet. Text uses the on-device parser; a receipt photo shows the error screen with "Von Hand eingeben". Enabling it needs Supabase anonymous sign-in, which is a separate change. |
| Daily AI limit window                 | Rolling 24 hours, instead of midnight in the user's time zone. Simpler, and the effect is the same.                                                                                 |
| Receipt photo retention (30 days)     | The config key exists, but the clean-up job comes later. Photos stay until then.                                                                                                    |
| Widget                                | **Not tonight.** It needs a separate native app extension. The Action Button is included (step 5).                                                                                  |
| RevenueCat                            | Later, as you planned.                                                                                                                                                              |

## What I can't verify here

- Real transcription, camera and a real OpenAI response. These need a phone and the API key.
- A development build. Native modules (MMKV, WebRTC) don't run in Expo Go.

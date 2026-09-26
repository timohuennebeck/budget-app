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

## 2. Live transcription with `expo-speech-recognition`

**Goal:** the voice screen transcribes what the user says, live, on the device.

- Install `expo-speech-recognition` and add its config plugin with microphone and speech-recognition permission texts. Android gets `RECORD_AUDIO`.
- Replace the simulated `use-voice-transcript.ts`:
  - it starts listening when the screen opens, in the app language (de-DE, en-US, pt-BR and so on)
  - it shows partial results live
  - "stop" finishes and sends the text through step 1
- **Permission denied:** a short message with a button to Settings, and a fallback to typing.
- The screen's highlighting of amounts stays as it is.
- Remove the `voiceSample` strings from all 7 languages; they're no longer needed.
- **Web:** uses the browser's speech recognition where available.
- **Tests:** type-check, lint and web only. Speech recognition itself needs a real phone.

---

## 3. Hosted Supabase project (`budget-app`, eu-west-1)

1. Apply the 3 migrations (schema, entries allowance, captures) through the Supabase connector. **No seed:** it contains the demo account and its password.
2. Deploy `parse-capture` through the connector.
3. Regenerate `database.types.ts` from the hosted schema and compare it with my hand-written version.
4. Run the connector's security and performance checks and fix anything they flag.

**What you need to do once:** add the OpenAI key as a Supabase secret, either in the dashboard (Edge Functions → Secrets → `OPENAI_API_KEY`) or with `supabase secrets set OPENAI_API_KEY=…`. Until then the function answers with an error and the app uses the on-device parser.

---

## 4. Review

Same as the first build: a code-simplifier pass and a code-reviewer pass as subagents over everything changed tonight, then fixes, re-verification and a push. I'll also refresh the design comparison page if screens changed.

---

## Decisions I'll make unless you say otherwise

| Question                              | Default                                                                                                                                                                             |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model                                 | `gpt-6-luna` for text and receipts. It's the cheapest; switch via `ai_model` if quality is lacking.                                                                                 |
| One receipt =                         | One entry: shop name and total, with the category guessed from the shop.                                                                                                            |
| AI during onboarding (before sign-up) | Not yet. Text uses the on-device parser; a receipt photo shows the error screen with "Von Hand eingeben". Enabling it needs Supabase anonymous sign-in, which is a separate change. |
| Daily AI limit window                 | Rolling 24 hours, instead of midnight in the user's time zone. Simpler, and the effect is the same.                                                                                 |
| Receipt photo retention (30 days)     | The config key exists, but the clean-up job comes later. Photos stay until then.                                                                                                    |
| Widget and Action Button              | **Not tonight.** Both need native iOS/Android code I can't build or test here.                                                                                                      |
| RevenueCat                            | Later, as you planned.                                                                                                                                                              |

## What I can't verify here

- Real speech recognition, camera and a real OpenAI response. These need a phone and the API key.
- A development build. Native modules (MMKV, speech) don't run in Expo Go.

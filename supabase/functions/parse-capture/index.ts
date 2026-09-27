import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

import { HttpError, json, serve } from '../_shared/http.ts';
import { admin, claimCapture, readConfig, readProfile, requireUser } from '../_shared/supabase.ts';
import { getProvider } from './providers/index.ts';
import type { CategoryChoice, MerchantHint, ParsedEntry } from './providers/types.ts';
import { decodeAudio, isSupportedAudio, transcribe } from './transcribe.ts';

// Turns typed text, a voice recording or a receipt photo into entries.
// Every call is logged in `captures`, which also counts the daily AI limit.
// Body: { source: 'text' | 'voice' | 'camera', text?, audio?, audio_type?,
//         capture_id?, receipt_path? }
// Voice sends the recording (base64); it's transcribed first and the text is
// parsed like a typed note. The transcript comes back as `transcript`.

interface Body {
  source?: string;
  text?: string;
  /** Voice: the recording as base64 */
  audio?: string;
  /** Voice: its MIME type, e.g. audio/m4a */
  audio_type?: string;
  capture_id?: string;
  receipt_path?: string;
}

// Transcription hints in the user's language: how amounts are usually said.
const VOICE_PROMPTS: Record<string, string> = {
  de: 'Döner 8 Euro, REWE 42,50, Kino 12, Gehalt 3.200 Euro.',
  en: 'Coffee 3.50, groceries 42, cinema 12, salary 3,200.',
};
// If the configured model is rejected, the long-standing one still works.
const FALLBACK_STT_MODEL = 'whisper-1';

const SOURCES = ['text', 'voice', 'camera'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function localNow(timeZone: string) {
  const format = (zone: string) =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: zone,
      weekday: 'long',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'longOffset',
    }).format(new Date());
  try {
    return format(timeZone);
  } catch {
    return format('UTC');
  }
}

async function readReceipt(path: string) {
  const { data, error } = await admin.storage.from('receipts').download(path);
  if (error || !data) throw new HttpError(422, 'receipt_not_found');
  const type = data.type || 'image/jpeg';
  return `data:${type};base64,${encodeBase64(new Uint8Array(await data.arrayBuffer()))}`;
}

// Every preset (id = preset id) plus the user's own categories (id = uuid);
// the app stores the chosen id in entries.preset_id or entries.category_id.
async function readCategories(userId: string, locale: string): Promise<CategoryChoice[]> {
  const [presets, own] = await Promise.all([
    admin.from('categories_presets').select('id, names, keywords, kind').order('sort_order'),
    admin
      .from('categories')
      .select('id, name')
      .eq('profile_id', userId)
      .is('archived_at', null)
      .order('sort_order'),
  ]);
  if (presets.error) throw presets.error;
  if (own.error) throw own.error;

  return [
    ...presets.data.map((preset) => {
      const names = preset.names as Record<string, string>;
      const keywords = preset.keywords as Record<string, string[]>;
      return {
        id: preset.id,
        name: names[locale] ?? names.en,
        kind: preset.kind as CategoryChoice['kind'],
        keywords: [...new Set(Object.values(keywords).flat())],
      };
    }),
    ...own.data.map((category) => ({
      id: category.id,
      name: category.name,
      kind: 'expense' as const,
      keywords: [],
    })),
  ];
}

/** Up to 60 recent merchants with the category the user filed them under. */
async function readHints(userId: string): Promise<MerchantHint[]> {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from('entries')
    .select('title, category_id, preset_id')
    .eq('profile_id', userId)
    .or('category_id.not.is.null,preset_id.not.is.null')
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  const seen = new Map<string, MerchantHint>();
  for (const row of data) {
    const key = row.title.toLowerCase();
    const categoryId = (row.preset_id ?? row.category_id)!;
    if (!seen.has(key)) seen.set(key, { title: row.title, categoryId });
  }
  return [...seen.values()].slice(0, 60);
}

/** Drops anything the schema allows but the database would reject. */
function clean(entries: ParsedEntry[], categoryKinds: Map<string, CategoryChoice['kind']>) {
  const now = Date.now();
  return entries
    .filter(
      (entry) => Number.isFinite(entry.amount) && entry.amount > 0 && entry.amount < 1_000_000,
    )
    .map((entry) => {
      const occurred = entry.occurred_at ? Date.parse(entry.occurred_at) : NaN;
      const kind = entry.kind === 'income' ? 'income' : 'expense';
      // Only a category of the entry's own kind (Gehalt for income, …).
      const categoryId =
        entry.category_id && categoryKinds.get(entry.category_id) === kind
          ? entry.category_id
          : null;
      return {
        title: (entry.title || '').trim().slice(0, 120) || '—',
        amount: Math.round(entry.amount * 100) / 100,
        kind,
        category_id: categoryId,
        occurred_at:
          Number.isFinite(occurred) && occurred <= now ? new Date(occurred).toISOString() : null,
        confident: entry.confident && categoryId !== null,
      };
    });
}

async function transcribeVoice(
  audio: Uint8Array<ArrayBuffer>,
  type: string,
  model: string,
  locale: string,
) {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new HttpError(503, 'transcription_unavailable');
  // The API wants ISO 639-1, so pt-BR becomes pt.
  const language = locale.slice(0, 2);
  const options = {
    apiKey,
    audio,
    type,
    language,
    prompt: VOICE_PROMPTS[language] ?? '',
  };
  try {
    return await transcribe({ ...options, model });
  } catch (error) {
    if (model === FALLBACK_STT_MODEL) throw error;
    console.warn(`transcription with ${model} failed, trying ${FALLBACK_STT_MODEL}`, error);
    return await transcribe({ ...options, model: FALLBACK_STT_MODEL });
  }
}

serve(async (request) => {
  if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
  const user = await requireUser(request);
  const body = (await request.json().catch(() => ({}))) as Body;

  const source = body.source ?? '';
  let text = body.text?.trim() ?? '';
  if (!SOURCES.includes(source)) throw new HttpError(400, 'invalid_source');
  const audio = source === 'voice' ? decodeAudio(body.audio ?? '') : null;
  const audioType = body.audio_type ?? '';
  if (source === 'voice' && (!audio || !isSupportedAudio(audioType))) {
    throw new HttpError(400, 'invalid_audio');
  }
  if (source === 'text' && (!text || text.length > 2000)) {
    throw new HttpError(400, 'invalid_text');
  }
  if (body.capture_id && !UUID.test(body.capture_id)) {
    throw new HttpError(400, 'invalid_capture_id');
  }
  const receiptPath = new RegExp(`^${user.id}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp|heic)$`);
  if (source === 'camera' && !receiptPath.test(body.receipt_path ?? '')) {
    throw new HttpError(400, 'invalid_receipt_path');
  }

  const [config, profile] = await Promise.all([
    readConfig({
      ai_provider: 'openai',
      ai_model: 'gpt-6-luna',
      stt_model: 'gpt-4o-mini-transcribe',
    }),
    readProfile(user.id),
  ]);
  const captureId = await claimCapture({
    profileId: user.id,
    source: source as 'text' | 'voice' | 'camera',
    // Receipts bring the id of their uploaded photo; text and voice get a new one.
    captureId: source === 'camera' ? body.capture_id : undefined,
    inputText: source === 'text' ? text : null,
    receiptPath: source === 'camera' ? body.receipt_path : null,
    provider: String(config.ai_provider),
    model: String(config.ai_model),
  });

  const started = Date.now();
  try {
    if (audio) {
      text = await transcribeVoice(audio, audioType, String(config.stt_model), profile.locale);
      await admin
        .from('captures')
        .update({ input_text: text.slice(0, 2000) })
        .eq('id', captureId);
      // Silence or noise: nothing to parse.
      if (!text) {
        await admin
          .from('captures')
          .update({
            status: 'parsed',
            result: [],
            completed_at: new Date().toISOString(),
          })
          .eq('id', captureId);
        return json({ capture_id: captureId, transcript: '', entries: [] });
      }
    }

    const [categories, hints, image] = await Promise.all([
      readCategories(user.id, profile.locale),
      readHints(user.id),
      source === 'camera' ? readReceipt(body.receipt_path!) : Promise.resolve(undefined),
    ]);
    const result = await getProvider(String(config.ai_provider)).parse(
      {
        text: source === 'camera' ? undefined : text,
        image,
        categories,
        hints,
        currency: profile.currency,
        locale: profile.locale,
        localNow: localNow(profile.time_zone),
      },
      String(config.ai_model),
    );
    const entries = clean(
      result.entries,
      new Map(categories.map((category) => [category.id, category.kind])),
    );

    await admin
      .from('captures')
      .update({
        status: 'parsed',
        result: entries,
        input_tokens: result.inputTokens,
        output_tokens: result.outputTokens,
        duration_ms: Date.now() - started,
        completed_at: new Date().toISOString(),
      })
      .eq('id', captureId);

    if (source === 'camera' && entries.length === 0) {
      throw new HttpError(422, 'receipt_unreadable');
    }
    return json({
      capture_id: captureId,
      ...(source === 'voice' ? { transcript: text } : {}),
      entries,
    });
  } catch (error) {
    const code = error instanceof HttpError ? error.code : 'provider_failed';
    await admin
      .from('captures')
      .update({
        status: 'failed',
        error_code: error instanceof Error ? error.message.slice(0, 200) : code,
        duration_ms: Date.now() - started,
        completed_at: new Date().toISOString(),
      })
      .eq('id', captureId)
      .neq('status', 'parsed');
    if (error instanceof HttpError) throw error;
    console.error(error);
    throw new HttpError(502, code);
  }
});

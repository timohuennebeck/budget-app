import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

import { HttpError, json, serve } from '../_shared/http.ts';
import { admin, claimCapture, readConfig, readProfile, requireUser } from '../_shared/supabase.ts';
import { getProvider } from './providers/index.ts';
import type { CategoryChoice, MerchantHint, ParsedEntry } from './providers/types.ts';

// Turns typed text, a voice transcript or a receipt photo into entries.
// Every call is logged in `captures`, which also counts the daily AI limit.
// Body: { source: 'text' | 'voice' | 'camera', text?, capture_id?, receipt_path? }

interface Body {
  source?: string;
  text?: string;
  capture_id?: string;
  receipt_path?: string;
}

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

async function readCategories(userId: string, locale: string): Promise<CategoryChoice[]> {
  const { data, error } = await admin
    .from('categories')
    .select('id, name, preset:categories_presets(names, keywords)')
    .eq('profile_id', userId)
    .is('archived_at', null);
  if (error) throw error;
  return data.map((category) => {
    const preset = category.preset as unknown as {
      names: Record<string, string>;
      keywords: Record<string, string[]>;
    } | null;
    return {
      id: category.id,
      name: preset?.names[locale] ?? category.name,
      keywords: preset ? [...new Set(Object.values(preset.keywords).flat())] : [],
    };
  });
}

/** Up to 60 recent merchants with the category the user filed them under. */
async function readHints(userId: string): Promise<MerchantHint[]> {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await admin
    .from('entries')
    .select('title, category_id')
    .eq('profile_id', userId)
    .not('category_id', 'is', null)
    .gte('occurred_at', since)
    .order('occurred_at', { ascending: false })
    .limit(300);
  if (error) throw error;
  const seen = new Map<string, MerchantHint>();
  for (const row of data) {
    const key = row.title.toLowerCase();
    if (!seen.has(key)) seen.set(key, { title: row.title, categoryId: row.category_id! });
  }
  return [...seen.values()].slice(0, 60);
}

/** Drops anything the schema allows but the database would reject. */
function clean(entries: ParsedEntry[], categoryIds: Set<string>) {
  const now = Date.now();
  return entries
    .filter(
      (entry) => Number.isFinite(entry.amount) && entry.amount > 0 && entry.amount < 1_000_000,
    )
    .map((entry) => {
      const occurred = entry.occurred_at ? Date.parse(entry.occurred_at) : NaN;
      const categoryId =
        entry.kind === 'expense' && entry.category_id && categoryIds.has(entry.category_id)
          ? entry.category_id
          : null;
      return {
        title: (entry.title || '').trim().slice(0, 120) || '—',
        amount: Math.round(entry.amount * 100) / 100,
        kind: entry.kind === 'income' ? 'income' : 'expense',
        category_id: categoryId,
        occurred_at:
          Number.isFinite(occurred) && occurred <= now ? new Date(occurred).toISOString() : null,
        confident: entry.confident && (entry.kind === 'income' || categoryId !== null),
      };
    });
}

serve(async (request) => {
  if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
  const user = await requireUser(request);
  const body = (await request.json().catch(() => ({}))) as Body;

  const source = body.source ?? '';
  const text = body.text?.trim() ?? '';
  if (!SOURCES.includes(source)) throw new HttpError(400, 'invalid_source');
  if (source !== 'camera' && (!text || text.length > 2000))
    throw new HttpError(400, 'invalid_text');
  if (body.capture_id && !UUID.test(body.capture_id))
    throw new HttpError(400, 'invalid_capture_id');
  const receiptPath = new RegExp(`^${user.id}/[0-9a-f-]{36}\\.(jpg|jpeg|png|webp|heic)$`);
  if (source === 'camera' && !receiptPath.test(body.receipt_path ?? '')) {
    throw new HttpError(400, 'invalid_receipt_path');
  }

  const [config, profile] = await Promise.all([
    readConfig({ ai_provider: 'openai', ai_model: 'gpt-6-luna' }),
    readProfile(user.id),
  ]);
  // A voice capture was counted by transcribe-session; this claims it once.
  const captureId = await claimCapture({
    profileId: user.id,
    source: source as 'text' | 'voice' | 'camera',
    status: 'processing',
    captureId: body.capture_id,
    inputText: source === 'camera' ? null : text,
    receiptPath: source === 'camera' ? body.receipt_path : null,
    provider: String(config.ai_provider),
    model: String(config.ai_model),
  });

  const started = Date.now();
  try {
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
    const entries = clean(result.entries, new Set(categories.map((category) => category.id)));

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

    if (source === 'camera' && entries.length === 0) throw new HttpError(422, 'receipt_unreadable');
    return json({ capture_id: captureId, entries });
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

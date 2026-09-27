import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

import { HttpError, json, serve } from '../_shared/http.ts';
import { admin, readAiUsage, readConfig, requireUser } from '../_shared/supabase.ts';
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
      name:
        preset?.names[locale] ??
        preset?.names[locale.split('-')[0]] ??
        preset?.names.en ??
        category.name,
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
        title: (entry.title || '').trim().slice(0, 120),
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
  if (source === 'camera' && !body.receipt_path?.startsWith(`${user.id}/`)) {
    throw new HttpError(400, 'invalid_receipt_path');
  }

  const config = await readConfig({
    ai_provider: 'openai',
    ai_model: 'gpt-6-luna',
    ai_captures_free: 20,
    ai_captures_plus: 200,
  });
  const usage = await readAiUsage(user.id);

  // A voice session already created its capture (and counted it) in
  // transcribe-session; reuse that row instead of counting twice.
  const { data: existing } = body.capture_id
    ? await admin
        .from('captures')
        .select('id, status')
        .eq('id', body.capture_id)
        .eq('profile_id', user.id)
        .maybeSingle()
    : { data: null };
  if (existing && existing.status !== 'pending') throw new HttpError(409, 'capture_already_parsed');
  if (!existing) {
    const limit = Number(usage.plus ? config.ai_captures_plus : config.ai_captures_free);
    if (usage.usedToday >= limit) throw new HttpError(429, 'ai_limit_reached');
  }

  const captureId = existing?.id ?? body.capture_id ?? crypto.randomUUID();
  const captureRow = {
    id: captureId,
    profile_id: user.id,
    source,
    input_text: source === 'camera' ? null : text,
    receipt_path: source === 'camera' ? body.receipt_path : null,
    provider: String(config.ai_provider),
    model: String(config.ai_model),
  };
  const saved = existing
    ? await admin.from('captures').update(captureRow).eq('id', captureId)
    : await admin.from('captures').insert(captureRow);
  if (saved.error) throw saved.error;

  const started = Date.now();
  try {
    const [categories, hints, image] = await Promise.all([
      readCategories(user.id, usage.profile.locale),
      readHints(user.id),
      source === 'camera' ? readReceipt(body.receipt_path!) : Promise.resolve(undefined),
    ]);
    const result = await getProvider(String(config.ai_provider)).parse(
      {
        text: source === 'camera' ? undefined : text,
        image,
        categories,
        hints,
        currency: usage.profile.currency,
        locale: usage.profile.locale,
        localNow: localNow(usage.profile.time_zone),
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
        latency_ms: Date.now() - started,
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
        latency_ms: Date.now() - started,
        completed_at: new Date().toISOString(),
      })
      .eq('id', captureId)
      .neq('status', 'parsed');
    if (error instanceof HttpError) throw error;
    console.error(error);
    throw new HttpError(502, code);
  }
});

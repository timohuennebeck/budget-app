import { randomUUID } from 'expo-crypto';

import { ensureUser } from '@/features/auth/lib/anonymous-user';

import { CaptureError, type ParsedEntry, parseCapture, uploadReceipt } from '../data/capture-api';
import { newDraftId, parseEntries } from './parse-entries';
import type { CategoryOption, DraftEntry } from './types';

interface CaptureInput {
  source: DraftEntry['source'];
  text: string;
  photoUri: string | null;
  /** Set by a voice session, which already counted against the AI limit */
  captureId: string | null;
  categories: CategoryOption[];
}

function toDrafts(captureId: string, entries: ParsedEntry[], source: DraftEntry['source']) {
  const now = new Date().toISOString();
  return entries.map<DraftEntry>((entry) => ({
    id: newDraftId(),
    title: entry.title,
    amount: entry.amount,
    kind: entry.kind,
    categoryId: entry.category_id,
    source,
    occurredAt: entry.occurred_at ?? now,
    uncertain: !entry.confident,
    captureId,
  }));
}

/**
 * Drafts for one capture. The parse-capture edge function reads text, voice
 * and receipts (during onboarding as an anonymous user); typed and spoken
 * text fall back to the on-device parser when it fails. Receipts have no
 * fallback and throw a CaptureError.
 */
export async function captureDrafts(input: CaptureInput): Promise<DraftEntry[]> {
  const { source, text, photoUri, captureId, categories } = input;
  const userId = await ensureUser();

  if (source === 'camera') {
    if (!userId) throw new CaptureError('signed_out', 401);
    if (!photoUri) throw new CaptureError('no_photo', 400);
    const id = randomUUID();
    const path = await uploadReceipt(userId, id, photoUri);
    const result = await parseCapture({ source, receipt_path: path, capture_id: id });
    return toDrafts(result.capture_id, result.entries, source);
  }

  const local = () => parseEntries(text, categories, { source }).entries;
  if (!userId) return local();
  try {
    const result = await parseCapture({
      source: source === 'voice' ? 'voice' : 'text',
      text,
      capture_id: captureId ?? undefined,
    });
    return toDrafts(result.capture_id, result.entries, source);
  } catch (error) {
    console.warn('parse-capture failed, parsing on device', error);
    return local();
  }
}

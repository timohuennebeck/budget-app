import { randomUUID } from 'expo-crypto';

import { CaptureError, type ParsedEntry, parseCapture, uploadReceipt } from '../data/capture-api';
import type { CaptureMode } from '../data/capture-store';
import { newDraftId, parseEntries } from './parse-entries';
import type { CategoryOption, DraftEntry } from './types';

interface CaptureInput {
  mode: CaptureMode;
  source: DraftEntry['source'];
  userId: string;
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
 * Drafts for one capture. Signed in, the parse-capture edge function reads
 * text, voice and receipts; typed and spoken text fall back to the on-device
 * parser when it fails. Receipts have no fallback and throw a CaptureError.
 */
export async function captureDrafts(input: CaptureInput): Promise<DraftEntry[]> {
  const { mode, source, userId, text, photoUri, captureId, categories } = input;
  // No AI before sign-up (onboarding runs without an account).
  const canUseAi = mode === 'app' && !!userId;

  if (source === 'camera') {
    if (!canUseAi) throw new CaptureError('signed_out', 401);
    if (!photoUri) throw new CaptureError('no_photo', 400);
    const id = randomUUID();
    const path = await uploadReceipt(userId, id, photoUri);
    const result = await parseCapture({ source, receipt_path: path, capture_id: id });
    return toDrafts(result.capture_id, result.entries, source);
  }

  const local = () => parseEntries(text, categories, { source }).entries;
  if (!canUseAi) return local();
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

import { randomUUID } from 'expo-crypto';

import { ensureUser } from '@/features/auth/lib/anonymous-user';

import {
  CaptureError,
  type ParsedEntry,
  parseCapture,
  readRecording,
  uploadReceipt,
} from '../data/capture-api';
import type { VoiceRecording } from '../data/capture-store';
import { newDraftId, parseEntries } from './parse-entries';
import type { CategoryOption, DraftEntry } from './types';

interface CaptureInput {
  source: DraftEntry['source'];
  text: string;
  photoUri: string | null;
  recording: VoiceRecording | null;
  categories: CategoryOption[];
  /** Voice: receives what was understood, e.g. for the text screen */
  onTranscript?: (text: string) => void;
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
 * recordings and receipts (during onboarding as an anonymous user); typed
 * text falls back to the on-device parser when it fails. Recordings and
 * receipts have no fallback and throw a CaptureError.
 */
export async function captureDrafts(input: CaptureInput): Promise<DraftEntry[]> {
  const { source, text, photoUri, recording, categories, onTranscript } = input;
  const userId = await ensureUser();

  if (source === 'voice') {
    if (!userId) throw new CaptureError('signed_out', 401);
    if (!recording) throw new CaptureError('no_recording', 400);
    const audio = await readRecording(recording.uri);
    const result = await parseCapture({ source, audio, audio_type: recording.type });
    onTranscript?.(result.transcript ?? '');
    return toDrafts(result.capture_id, result.entries, source);
  }

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
    const result = await parseCapture({ source: 'text', text });
    return toDrafts(result.capture_id, result.entries, source);
  } catch (error) {
    console.warn('parse-capture failed, parsing on device', error);
    return local();
  }
}

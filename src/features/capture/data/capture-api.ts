import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { FunctionsHttpError } from '@supabase/supabase-js';

import type { Enums } from '@/shared/lib/database.types';
import { supabase } from '@/shared/lib/supabase';

/** An entry as the parse-capture edge function returns it. */
export interface ParsedEntry {
  title: string;
  amount: number;
  kind: Enums<'entry_kind'>;
  category_id: string | null;
  occurred_at: string | null;
  confident: boolean;
}

export interface ParseRequest {
  source: 'text' | 'voice' | 'camera';
  text?: string;
  capture_id?: string;
  receipt_path?: string;
}

/** A failed capture with the function's error code and HTTP status. */
export class CaptureError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
  ) {
    super(code);
  }
}

// Turns functions.invoke errors into a CaptureError with the JSON error code.
export async function toCaptureError(error: unknown) {
  if (error instanceof FunctionsHttpError) {
    const response = error.context as Response;
    const body = await response.json().catch(() => ({}));
    return new CaptureError(body.error ?? 'unknown', response.status);
  }
  return new CaptureError('network', 0);
}

export async function parseCapture(request: ParseRequest) {
  const { data, error } = await supabase.functions.invoke<{
    capture_id: string;
    entries: ParsedEntry[];
  }>('parse-capture', { body: request });
  if (error || !data) throw await toCaptureError(error);
  return data;
}

const MAX_WIDTH = 1600;

/**
 * Shrinks the photo (smaller upload, fewer tokens) and stores it in the
 * user's folder of the private receipts bucket. Returns the object path.
 */
export async function uploadReceipt(userId: string, captureId: string, uri: string) {
  let photo = await ImageManipulator.manipulate(uri).renderAsync();
  if (photo.width > MAX_WIDTH) {
    photo = await ImageManipulator.manipulate(uri).resize({ width: MAX_WIDTH }).renderAsync();
  }
  const image = await photo.saveAsync({ compress: 0.7, format: SaveFormat.JPEG });
  const body = await (await fetch(image.uri)).arrayBuffer();
  const path = `${userId}/${captureId}.jpg`;
  const { error } = await supabase.storage
    .from('receipts')
    .upload(path, body, { contentType: 'image/jpeg', upsert: true });
  if (error) throw new CaptureError('upload_failed', 0);
  return path;
}

export interface VoiceSession {
  capture_id: string;
  /** Short-lived OpenAI Realtime client secret */
  client_secret: string;
  expires_at: number;
  max_seconds: number;
}

/** Checks the AI limit, logs the capture and returns an OpenAI client secret. */
export async function startVoiceSession() {
  const { data, error } = await supabase.functions.invoke<VoiceSession>('transcribe-session', {
    body: {},
  });
  if (error || !data) throw await toCaptureError(error);
  return data;
}

const REALTIME_CALLS_URL = 'https://api.openai.com/v1/realtime/calls';

/** WebRTC offer/answer exchange with OpenAI Realtime; returns the answer SDP. */
export async function exchangeRealtimeSdp(offerSdp: string, clientSecret: string) {
  const response = await fetch(REALTIME_CALLS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${clientSecret}`, 'Content-Type': 'application/sdp' },
    body: offerSdp,
  });
  if (!response.ok) throw new CaptureError(`realtime_${response.status}`, response.status);
  return response.text();
}

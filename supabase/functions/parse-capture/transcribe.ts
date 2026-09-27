import { decodeBase64 } from 'jsr:@std/encoding@1/base64';

// Speech to text for voice captures: the app records locally and sends the
// file once the user stops; OpenAI's transcription endpoint returns the text,
// which then goes through the same parsing as typed notes.

const TRANSCRIPTIONS_URL = 'https://api.openai.com/v1/audio/transcriptions';

/** About two minutes of the app's 32 kbit/s mono AAC, with headroom. */
export const MAX_AUDIO_BYTES = 1_500_000;

const EXTENSIONS: Record<string, string> = {
  'audio/m4a': 'm4a',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'm4a',
  'audio/webm': 'webm',
  'audio/wav': 'wav',
  'audio/mpeg': 'mp3',
};

export function isSupportedAudio(type: string) {
  return type in EXTENSIONS;
}

/** Decodes the base64 recording; null when it's empty or too large. */
export function decodeAudio(base64: string): Uint8Array<ArrayBuffer> | null {
  try {
    const bytes = decodeBase64(base64) as Uint8Array<ArrayBuffer>;
    return bytes.length > 0 && bytes.length <= MAX_AUDIO_BYTES ? bytes : null;
  } catch {
    return null;
  }
}

export async function transcribe(options: {
  apiKey: string;
  model: string;
  audio: Uint8Array<ArrayBuffer>;
  type: string;
  /** ISO 639-1, e.g. "de" */
  language: string;
  /** Style hint, e.g. how amounts are usually said */
  prompt: string;
  fetcher?: typeof fetch;
}) {
  const form = new FormData();
  const file = new Blob([options.audio], { type: options.type });
  form.append('file', file, `voice.${EXTENSIONS[options.type] ?? 'm4a'}`);
  form.append('model', options.model);
  form.append('language', options.language);
  if (options.prompt) form.append('prompt', options.prompt);
  form.append('response_format', 'json');

  const response = await (options.fetcher ?? fetch)(TRANSCRIPTIONS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${options.apiKey}` },
    body: form,
  });
  const body = (await response.json().catch(() => ({}))) as {
    text?: string;
    error?: { message?: string };
  };
  if (!response.ok) {
    throw new Error(`transcription_${response.status}: ${body.error?.message ?? ''}`);
  }
  return (body.text ?? '').trim();
}

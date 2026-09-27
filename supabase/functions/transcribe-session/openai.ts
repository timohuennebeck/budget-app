// OpenAI Realtime transcription: mints a short-lived client secret for a
// transcription-only session. The app connects with it over WebRTC
// (POST https://api.openai.com/v1/realtime/calls) and never sees the API key.

export interface TranscriptionSession {
  clientSecret: string;
  expiresAt: number;
}

export async function createTranscriptionSession(
  apiKey: string,
  model: string,
  language: string,
  fetcher: typeof fetch = fetch,
): Promise<TranscriptionSession> {
  const response = await fetcher('https://api.openai.com/v1/realtime/client_secrets', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      expires_after: { anchor: 'created_at', seconds: 120 },
      session: {
        type: 'transcription',
        audio: {
          input: {
            transcription: { model, language },
            noise_reduction: { type: 'near_field' },
          },
        },
      },
    }),
  });
  const body = (await response.json()) as {
    value?: string;
    expires_at?: number;
    error?: { message?: string };
  };
  if (!response.ok || !body.value) {
    throw new Error(`openai_${response.status}: ${body.error?.message ?? 'no client secret'}`);
  }
  return { clientSecret: body.value, expiresAt: body.expires_at ?? 0 };
}

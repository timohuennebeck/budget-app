import { assertEquals, assertRejects } from 'jsr:@std/assert@1';

import { createTranscriptionSession } from './openai.ts';

Deno.test('creates a transcription-only client secret', async () => {
  let sent: Request | undefined;
  const fetcher = ((url: string, init: RequestInit) => {
    sent = new Request(url, init);
    return Promise.resolve(
      new Response(JSON.stringify({ value: 'ek_123', expires_at: 1790000000 })),
    );
  }) as typeof fetch;

  const session = await createTranscriptionSession('sk-test', 'gpt-live-transcribe', 'de', fetcher);
  assertEquals(session, { clientSecret: 'ek_123', expiresAt: 1790000000 });
  assertEquals(sent!.url, 'https://api.openai.com/v1/realtime/client_secrets');
  const body = await sent!.json();
  assertEquals(body.session.type, 'transcription');
  assertEquals(body.session.audio.input.transcription, {
    model: 'gpt-live-transcribe',
    language: 'de',
  });
});

Deno.test('fails without a client secret', async () => {
  const fetcher = (() =>
    Promise.resolve(
      new Response(JSON.stringify({ error: { message: 'nope' } }), { status: 400 }),
    )) as typeof fetch;
  await assertRejects(
    () => createTranscriptionSession('k', 'm', 'en', fetcher),
    Error,
    'openai_400: nope',
  );
});

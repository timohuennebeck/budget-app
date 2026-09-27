import { assertEquals, assertRejects } from 'jsr:@std/assert@1';
import { encodeBase64 } from 'jsr:@std/encoding@1/base64';

import { decodeAudio, MAX_AUDIO_BYTES, transcribe } from './transcribe.ts';

const audio = new Uint8Array([1, 2, 3, 4]) as Uint8Array<ArrayBuffer>;

Deno.test('sends the recording as multipart and returns the trimmed text', async () => {
  let form: FormData | undefined;
  const fetcher = (async (_url: string, init: RequestInit) => {
    form = init.body as FormData;
    return new Response(JSON.stringify({ text: ' Döner 8 Euro ' }), { status: 200 });
  }) as typeof fetch;

  const text = await transcribe({
    apiKey: 'key',
    model: 'gpt-4o-mini-transcribe',
    audio,
    type: 'audio/m4a',
    language: 'de',
    prompt: '',
    fetcher,
  });

  assertEquals(text, 'Döner 8 Euro');
  assertEquals(form?.get('model'), 'gpt-4o-mini-transcribe');
  assertEquals(form?.get('language'), 'de');
  assertEquals(form?.get('prompt'), null);
  assertEquals((form?.get('file') as File).name, 'voice.m4a');
});

Deno.test('throws on an API error', async () => {
  const fetcher = (async () =>
    new Response(JSON.stringify({ error: { message: 'bad model' } }), {
      status: 400,
    })) as typeof fetch;
  await assertRejects(
    () =>
      transcribe({
        apiKey: 'k',
        model: 'x',
        audio,
        type: 'audio/webm',
        language: 'en',
        prompt: '',
        fetcher,
      }),
    Error,
    'transcription_400',
  );
});

Deno.test('rejects empty, invalid and oversized audio', () => {
  assertEquals(decodeAudio(''), null);
  assertEquals(decodeAudio('%%%'), null);
  assertEquals(decodeAudio(encodeBase64(new Uint8Array(MAX_AUDIO_BYTES + 1))), null);
  assertEquals(decodeAudio(encodeBase64(audio))?.length, 4);
});

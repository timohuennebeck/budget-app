import { assertEquals, assertRejects } from 'jsr:@std/assert@1';

import { createOpenAiProvider } from './openai.ts';
import type { ParsedEntry, ParseInput } from './types.ts';

const input: ParseInput = {
  text: '40€ REWE, 12€ Uber',
  categories: [{ id: 'cat-groceries', name: 'Lebensmittel', kind: 'expense', keywords: ['rewe'] }],
  hints: [{ title: 'Uber', categoryId: 'cat-groceries' }],
  currency: 'EUR',
  locale: 'de',
  localNow: 'Monday, 28/09/2026, 19:40',
};

function fakeFetch(status: number, body: unknown, seen: Request[] = []) {
  return ((url: string, init: RequestInit) => {
    seen.push(new Request(url, init));
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
  }) as typeof fetch;
}

Deno.test(
  'sends a strict schema limited to the user categories and parses output_text',
  async () => {
    const seen: Request[] = [];
    const entries: ParsedEntry[] = [
      {
        title: 'REWE',
        amount: 40,
        kind: 'expense',
        category_id: 'cat-groceries',
        occurred_at: null,
        confident: true,
      },
    ];
    const provider = createOpenAiProvider(
      'sk-test',
      fakeFetch(
        200,
        {
          output: [
            { type: 'reasoning' },
            {
              type: 'message',
              content: [{ type: 'output_text', text: JSON.stringify({ entries }) }],
            },
          ],
          usage: { input_tokens: 812, output_tokens: 64 },
        },
        seen,
      ),
    );
    const result = await provider.parse(input, 'gpt-6-luna');
    assertEquals(result.entries, entries);
    assertEquals([result.inputTokens, result.outputTokens], [812, 64]);

    const request = seen[0];
    assertEquals(request.url, 'https://api.openai.com/v1/responses');
    assertEquals(request.headers.get('authorization'), 'Bearer sk-test');
    const body = await request.json();
    assertEquals(body.model, 'gpt-6-luna');
    assertEquals(body.store, false);
    assertEquals(body.text.format.type, 'json_schema');
    assertEquals(body.text.format.strict, true);
    const item = body.text.format.schema.properties.entries.items;
    assertEquals(item.properties.category_id.enum, ['cat-groceries', null]);
    assertEquals(body.input[0].content[0].type, 'input_text');
  },
);

Deno.test('attaches receipt photos as input_image', async () => {
  const seen: Request[] = [];
  const provider = createOpenAiProvider(
    'sk-test',
    fakeFetch(
      200,
      { output: [{ type: 'message', content: [{ type: 'output_text', text: '{"entries":[]}' }] }] },
      seen,
    ),
  );
  await provider.parse(
    { ...input, text: undefined, image: 'data:image/jpeg;base64,AAA' },
    'gpt-6-luna',
  );
  const body = await seen[0].json();
  assertEquals(body.input[0].content[1], {
    type: 'input_image',
    image_url: 'data:image/jpeg;base64,AAA',
  });
});

Deno.test('surfaces API errors and refusals', async () => {
  await assertRejects(
    () =>
      createOpenAiProvider('k', fakeFetch(401, { error: { message: 'bad key' } })).parse(
        input,
        'm',
      ),
    Error,
    'openai_401: bad key',
  );
  await assertRejects(
    () =>
      createOpenAiProvider(
        'k',
        fakeFetch(200, {
          output: [{ type: 'message', content: [{ type: 'refusal', refusal: 'no' }] }],
        }),
      ).parse(input, 'm'),
    Error,
    'openai_refusal',
  );
});

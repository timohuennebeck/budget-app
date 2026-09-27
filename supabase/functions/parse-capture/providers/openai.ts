import { entriesSchema, instructions, userPrompt } from '../prompt.ts';
import type { CaptureProvider, ParsedEntry } from './types.ts';

// OpenAI Responses API with structured outputs (strict JSON schema).
// The API key comes from the OPENAI_API_KEY function secret.

interface ResponsesOutput {
  output?: { type: string; content?: { type: string; text?: string; refusal?: string }[] }[];
  usage?: { input_tokens?: number; output_tokens?: number };
  error?: { message?: string } | null;
}

export function createOpenAiProvider(
  apiKey: string,
  fetcher: typeof fetch = fetch,
): CaptureProvider {
  return {
    async parse(input, model) {
      const content: Record<string, string>[] = [{ type: 'input_text', text: userPrompt(input) }];
      if (input.image) content.push({ type: 'input_image', image_url: input.image });

      const response = await fetcher('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          instructions,
          input: [{ role: 'user', content }],
          text: {
            format: {
              type: 'json_schema',
              name: 'entries',
              strict: true,
              schema: entriesSchema(input.categories.map((category) => category.id)),
            },
          },
          store: false,
        }),
      });
      const body = (await response.json()) as ResponsesOutput;
      if (!response.ok) throw new Error(`openai_${response.status}: ${body.error?.message ?? ''}`);

      const parts = (body.output ?? []).flatMap((item) => item.content ?? []);
      const refusal = parts.find((part) => part.type === 'refusal');
      if (refusal) throw new Error(`openai_refusal: ${refusal.refusal ?? ''}`);
      const text = parts.find((part) => part.type === 'output_text')?.text;
      if (!text) throw new Error('openai_empty_output');

      const parsed = JSON.parse(text) as { entries: ParsedEntry[] };
      return {
        entries: parsed.entries,
        inputTokens: body.usage?.input_tokens ?? null,
        outputTokens: body.usage?.output_tokens ?? null,
      };
    },
  };
}

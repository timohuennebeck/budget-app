import { createOpenAiProvider } from './openai.ts';
import type { CaptureProvider } from './types.ts';

/** The provider named in app_config.ai_provider. */
export function getProvider(name: string): CaptureProvider {
  if (name === 'openai') {
    const key = Deno.env.get('OPENAI_API_KEY');
    if (!key) throw new Error('missing_openai_api_key');
    return createOpenAiProvider(key);
  }
  throw new Error(`unknown_ai_provider: ${name}`);
}

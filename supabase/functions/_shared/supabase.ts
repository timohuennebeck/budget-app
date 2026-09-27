import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2';

import { HttpError } from './http.ts';

// Newer projects expose API keys as JSON maps; older ones as single values.
function secretKey() {
  const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
  if (keys) return (JSON.parse(keys) as Record<string, string>).default;
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
}

/** Service-role client: bypasses RLS, so every query must scope by user id. */
export const admin: SupabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, secretKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** The signed-in user behind the request's bearer token, or a 401. */
export async function requireUser(request: Request) {
  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(401, 'not_authenticated');
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'not_authenticated');
  return data.user;
}

/** app_config values by key; missing keys fall back to `defaults`. */
export async function readConfig<T extends Record<string, unknown>>(defaults: T): Promise<T> {
  const { data, error } = await admin
    .from('app_config')
    .select('key, value')
    .in('key', Object.keys(defaults));
  if (error) throw error;
  const values = Object.fromEntries(data.map((row) => [row.key, row.value]));
  return { ...defaults, ...values } as T;
}

export interface CaptureProfile {
  locale: string;
  currency: string;
  time_zone: string;
}

export async function readProfile(userId: string): Promise<CaptureProfile> {
  const { data, error } = await admin
    .from('profiles')
    .select('locale, currency, time_zone')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
}

interface CaptureClaim {
  profileId: string;
  source: 'text' | 'voice' | 'camera';
  captureId?: string;
  inputText?: string | null;
  receiptPath?: string | null;
  provider?: string;
  model?: string;
}

/**
 * Logs an AI capture as processing and counts it against the daily limit in
 * one locked step (claim_ai_capture). A reused id (a retried receipt) is 409.
 */
export async function claimCapture(claim: CaptureClaim): Promise<string> {
  const { data, error } = await admin.rpc('claim_ai_capture', {
    p_profile_id: claim.profileId,
    p_source: claim.source,
    p_status: 'processing',
    p_capture_id: claim.captureId ?? null,
    p_input_text: claim.inputText ?? null,
    p_receipt_path: claim.receiptPath ?? null,
    p_provider: claim.provider ?? null,
    p_model: claim.model ?? null,
  });
  if (error) {
    if (error.message.includes('ai_limit_reached')) throw new HttpError(429, 'ai_limit_reached');
    if (error.code === '23505') {
      throw new HttpError(409, 'capture_already_parsed');
    }
    throw error;
  }
  return data as string;
}

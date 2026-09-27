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

export interface AiUsage {
  profile: { locale: string; currency: string; time_zone: string; plus_expires_at: string | null };
  plus: boolean;
  usedToday: number;
}

/** The user's profile and how many AI captures they started in the last 24 hours. */
export async function readAiUsage(userId: string): Promise<AiUsage> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [profile, captures] = await Promise.all([
    admin
      .from('profiles')
      .select('locale, currency, time_zone, plus_expires_at')
      .eq('id', userId)
      .single(),
    admin
      .from('captures')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .gte('created_at', since),
  ]);
  if (profile.error) throw profile.error;
  if (captures.error) throw captures.error;
  const plus =
    !!profile.data.plus_expires_at && new Date(profile.data.plus_expires_at) > new Date();
  return { profile: profile.data, plus, usedToday: captures.count ?? 0 };
}

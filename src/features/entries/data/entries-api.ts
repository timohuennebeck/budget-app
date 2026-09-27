import type { Tables, TablesInsert, TablesUpdate } from '@/shared/lib/database.types';
import type { DateRange } from '@/shared/lib/dates';
import { supabase } from '@/shared/lib/supabase';

export type Entry = Tables<'entries'>;
export type EntryInsert = TablesInsert<'entries'>;
export type EntryUpdate = TablesUpdate<'entries'>;

export async function fetchEntries({ start, end }: DateRange) {
  const { data, error } = await supabase
    .from('entries')
    .select('*')
    .gte('occurred_at', start.toISOString())
    .lt('occurred_at', end.toISOString())
    .order('occurred_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchEntry(id: string) {
  const { data, error } = await supabase.from('entries').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}

const STREAK_WINDOW_DAYS = 60;

/** Total number of entries and the dates of the last 60 days, for streaks. */
export async function fetchEntryStats() {
  const since = new Date(Date.now() - STREAK_WINDOW_DAYS * 86_400_000);
  const [total, recent] = await Promise.all([
    supabase.from('entries').select('id', { count: 'exact', head: true }),
    supabase.from('entries').select('occurred_at').gte('occurred_at', since.toISOString()),
  ]);
  if (total.error) throw total.error;
  if (recent.error) throw recent.error;
  return {
    total: total.count ?? 0,
    recentDates: recent.data.map((row) => new Date(row.occurred_at)),
  };
}

/** Entries used in the budget month starting on `periodStart` (YYYY-MM-DD). */
export async function fetchEntriesAllowance(periodStart: string) {
  const { data, error } = await supabase
    .from('entries_allowance')
    .select('used')
    .eq('period_start', periodStart)
    .maybeSingle();
  if (error) throw error;
  return data?.used ?? 0;
}

/** When the last Apple Pay payment came in, or null if none has yet. */
export async function fetchLastWalletPayment() {
  const { data, error } = await supabase
    .from('entries')
    .select('occurred_at')
    .eq('source', 'wallet')
    .order('occurred_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.occurred_at ?? null;
}

/** Whether the signed-in user has saved any entry yet. */
export async function hasEntries() {
  const { data, error } = await supabase.from('entries').select('id').limit(1);
  if (error) throw error;
  return data.length > 0;
}

export async function insertEntries(rows: EntryInsert[]) {
  const { data, error } = await supabase.from('entries').insert(rows).select();
  if (error) throw error;
  return data;
}

export async function updateEntry(id: string, patch: EntryUpdate) {
  const { data, error } = await supabase
    .from('entries')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteEntry(id: string) {
  const { error } = await supabase.from('entries').delete().eq('id', id);
  if (error) throw error;
}

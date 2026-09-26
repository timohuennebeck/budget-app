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

/** Only the timestamps of every entry, for streaks and totals. */
export async function fetchEntryDates() {
  const { data, error } = await supabase.from('entries').select('occurred_at');
  if (error) throw error;
  return data.map((row) => new Date(row.occurred_at));
}

export async function countEntries({ start, end }: DateRange) {
  const { count, error } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', start.toISOString())
    .lt('created_at', end.toISOString());
  if (error) throw error;
  return count ?? 0;
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

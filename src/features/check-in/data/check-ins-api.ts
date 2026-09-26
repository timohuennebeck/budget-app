import type { Tables, TablesInsert } from '@/shared/lib/database.types';
import { supabase } from '@/shared/lib/supabase';

export type CheckIn = Tables<'weekly_check_ins'>;

export async function fetchCheckIns() {
  const { data, error } = await supabase
    .from('weekly_check_ins')
    .select('*')
    .order('week_start', { ascending: false })
    .limit(26);
  if (error) throw error;
  return data;
}

export async function saveCheckIn(row: TablesInsert<'weekly_check_ins'>) {
  const { data, error } = await supabase
    .from('weekly_check_ins')
    .upsert(row, { onConflict: 'profile_id,week_start' })
    .select()
    .single();
  if (error) throw error;
  return data;
}

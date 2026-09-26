import type { Tables, TablesInsert, TablesUpdate } from '@/shared/lib/database.types';
import { supabase } from '@/shared/lib/supabase';

export type Category = Tables<'categories'>;
export type CategoryInsert = TablesInsert<'categories'>;

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order')
    .order('created_at');
  if (error) throw error;
  return data;
}

export async function insertCategories(rows: CategoryInsert[]) {
  const { data, error } = await supabase.from('categories').insert(rows).select();
  if (error) throw error;
  return data;
}

export async function updateCategory(id: string, patch: TablesUpdate<'categories'>) {
  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

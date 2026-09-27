import type { Tables } from '@/shared/lib/database.types';
import { supabase } from '@/shared/lib/supabase';

import { categoryColumns } from '../lib/category-ref';

export type CategoryLimit = Tables<'categories_limits'>;

export async function fetchLimits() {
  const { data, error } = await supabase.from('categories_limits').select('*');
  if (error) throw error;
  return data;
}

/** The table only takes positive limits; one stepped down to 0 means none. */
export const positiveOrNull = (amount: number | null) =>
  amount !== null && amount > 0 ? amount : null;

// Only categories with a limit have a row; "no limit" deletes it.
export async function setLimit(profileId: string, categoryId: string, amount: number | null) {
  const limit = positiveOrNull(amount);
  if (limit === null) {
    const { category_id, preset_id } = categoryColumns(categoryId);
    const query = supabase.from('categories_limits').delete();
    const { error } = await (category_id
      ? query.eq('category_id', category_id)
      : query.eq('preset_id', preset_id!));
    if (error) throw error;
    return;
  }
  await upsertLimits(profileId, [[categoryId, limit]]);
}

/** Sets several limits at once, e.g. the ones chosen during onboarding; 0 is skipped. */
export async function upsertLimits(profileId: string, limits: [string, number | null][]) {
  const rows = limits.flatMap(([id, amount]) => {
    const limit = positiveOrNull(amount);
    return limit === null ? [] : [{ profile_id: profileId, ...categoryColumns(id), amount: limit }];
  });
  if (!rows.length) return;
  const { error } = await supabase
    .from('categories_limits')
    .upsert(rows, { onConflict: 'profile_id,category_id,preset_id' });
  if (error) throw error;
}

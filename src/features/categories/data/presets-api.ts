import type { Tables } from '@/shared/lib/database.types';
import { supabase } from '@/shared/lib/supabase';

/** A built-in category with its names and parser keywords in every app language. */
export interface CategoryPreset extends Omit<Tables<'categories_presets'>, 'names' | 'keywords'> {
  names: Record<string, string>;
  keywords: Record<string, string[]>;
}

// Readable without an account, so onboarding can offer presets before sign-up.
export async function fetchPresets() {
  const { data, error } = await supabase.from('categories_presets').select('*').order('sort_order');
  if (error) throw error;
  return data as CategoryPreset[];
}

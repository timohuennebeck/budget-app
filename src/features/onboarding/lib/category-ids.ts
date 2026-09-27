import type { CategoryPreset } from '@/features/categories/data/presets-api';

/** Until the user changes the selection, the suggested presets are picked. */
export function resolveCategoryIds(chosen: string[] | null, presets: CategoryPreset[] | undefined) {
  return chosen ?? (presets ?? []).filter((preset) => preset.suggested).map((preset) => preset.key);
}

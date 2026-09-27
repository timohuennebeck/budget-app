import { randomUUID } from 'expo-crypto';

import { usePresetDisplays } from './use-category-display';
import { useCategories, useCreateCategory } from './use-categories';

/**
 * Adds the presets among `ids` the user doesn't have yet (a capture can
 * suggest one) and returns how each id maps to a real category id.
 */
export function useAddSuggestedCategories() {
  const { data: categories = [] } = useCategories();
  const presets = usePresetDisplays();
  const create = useCreateCategory();

  return async (ids: (string | null)[]) => {
    const mapping = new Map<string, string>();
    let sortOrder = categories.length;
    for (const id of new Set(ids)) {
      if (!id || categories.some((category) => category.id === id)) continue;
      const preset = presets.find((candidate) => candidate.id === id);
      if (!preset) continue;
      const created = randomUUID();
      await create.mutateAsync({
        id: created,
        preset_id: preset.presetId,
        name: preset.name,
        icon: preset.icon,
        hue: preset.hue,
        sort_order: sortOrder++,
      });
      mapping.set(id, created);
    }
    return mapping;
  };
}

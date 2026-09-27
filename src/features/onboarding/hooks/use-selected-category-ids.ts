import { useMemo } from 'react';

import type { CategoryPreset } from '@/features/categories/data/presets-api';
import { usePresets } from '@/features/categories/hooks/use-presets';

import { useOnboardingStore } from '../data/onboarding-store';

/** Until the user changes the selection, the suggested presets are picked. */
export function resolveCategoryIds(chosen: string[] | null, presets: CategoryPreset[] | undefined) {
  return chosen ?? (presets ?? []).filter((preset) => preset.suggested).map((preset) => preset.key);
}

/** Selected preset keys and custom category ids, in display order. */
export function useSelectedCategoryIds() {
  const chosen = useOnboardingStore((state) => state.categoryIds);
  const { data: presets } = usePresets();
  return useMemo(() => resolveCategoryIds(chosen, presets), [chosen, presets]);
}

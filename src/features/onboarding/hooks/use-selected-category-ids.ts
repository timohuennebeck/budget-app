import { useMemo } from 'react';

import { usePresets } from '@/features/categories/hooks/use-presets';

import { useOnboardingStore } from '../data/onboarding-store';
import { resolveCategoryIds } from '../lib/category-ids';

/** Selected preset keys and custom category ids, in display order. */
export function useSelectedCategoryIds() {
  const chosen = useOnboardingStore((state) => state.categoryIds);
  const { data: presets } = usePresets();
  return useMemo(() => resolveCategoryIds(chosen, presets), [chosen, presets]);
}

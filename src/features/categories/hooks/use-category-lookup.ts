import { useMemo } from 'react';

import { type CategoryDisplay, useAppCategoryDisplays } from './use-category-display';

/** Translated categories by id, archived ones included, for rendering entry rows. */
export function useCategoryLookup() {
  const categories = useAppCategoryDisplays(true, true);
  return useMemo(
    () => new Map<string, CategoryDisplay>(categories.map((category) => [category.id, category])),
    [categories],
  );
}

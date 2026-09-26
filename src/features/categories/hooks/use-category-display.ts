import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';

import { categoryCatalog, findCatalogCategory } from '../data/category-catalog';
import { categoryName } from '../lib/category-name';
import { useCategories } from './use-categories';

/** Minimal shape every category list/row/picker renders. */
export interface CategoryDisplay {
  id: string;
  key: string | null;
  name: string;
  icon: string;
  hue: number;
  keywords: string[];
}

/** The signed-in user's categories, translated and with parser keywords. */
export function useAppCategoryDisplays(enabled = true): CategoryDisplay[] {
  const { data } = useCategories(enabled);
  const { i18n } = useTranslation();
  return useMemo(
    () =>
      (data ?? []).map((category) => ({
        id: category.id,
        key: category.key,
        name: categoryName(category),
        icon: category.icon,
        hue: category.hue,
        keywords: findCatalogCategory(category.key)?.keywords ?? [],
      })),
    // Re-translate when the language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, i18n.language],
  );
}

function catalogDisplay(key: string): CategoryDisplay | null {
  const catalog = findCatalogCategory(key);
  if (!catalog) return null;
  return {
    id: key,
    key,
    name: categoryName({ key, name: key }),
    icon: catalog.icon,
    hue: catalog.hue,
    keywords: catalog.keywords,
  };
}

/** Every built-in category, e.g. for parsing before the user picked any. */
export function useCatalogDisplays(): CategoryDisplay[] {
  const { i18n } = useTranslation();
  return useMemo(
    () => categoryCatalog.map((category) => catalogDisplay(category.key)!),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [i18n.language],
  );
}

/** Onboarding selection (catalog keys + custom drafts) in the same shape. */
export function useOnboardingCategoryDisplays(): CategoryDisplay[] {
  const categoryIds = useOnboardingStore((state) => state.categoryIds);
  const customCategories = useOnboardingStore((state) => state.customCategories);
  const { i18n } = useTranslation();

  return useMemo(
    () =>
      categoryIds.flatMap((id): CategoryDisplay[] => {
        const catalog = catalogDisplay(id);
        if (catalog) return [catalog];
        const custom = customCategories.find((category) => category.id === id);
        return custom ? [{ ...custom, key: null, keywords: [] }] : [];
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categoryIds, customCategories, i18n.language],
  );
}

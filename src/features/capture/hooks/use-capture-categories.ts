import {
  type CategoryDisplay,
  useAppCategoryDisplays,
  useCatalogDisplays,
} from '@/features/categories/hooks/use-category-display';

import type { CaptureMode } from '../data/capture-store';

/**
 * Categories the parser and pickers work with: the user's own in the app,
 * the full catalog during onboarding (before categories are chosen).
 */
export function useCaptureCategories(mode: CaptureMode): CategoryDisplay[] {
  const app = useAppCategoryDisplays(mode === 'app');
  const catalog = useCatalogDisplays();
  return mode === 'app' ? app : catalog;
}

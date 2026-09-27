import {
  type CategoryDisplay,
  useAppCategoryDisplays,
  usePresetDisplays,
} from '@/features/categories/hooks/use-category-display';

import type { CaptureMode } from '../data/capture-store';

/**
 * Categories the parser and pickers work with: the user's own in the app,
 * every preset during onboarding (before categories are chosen).
 */
export function useCaptureCategories(mode: CaptureMode): CategoryDisplay[] {
  const app = useAppCategoryDisplays(mode === 'app');
  const presets = usePresetDisplays();
  return mode === 'app' ? app : presets;
}

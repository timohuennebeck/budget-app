import {
  type CategoryDisplay,
  useAppCategoryDisplays,
} from '@/features/categories/hooks/use-category-display';

import type { CaptureMode } from '../data/capture-store';

/** Categories the parser and pickers work with: every preset, plus the
 * user's own categories once signed in. */
export function useCaptureCategories(mode: CaptureMode): CategoryDisplay[] {
  return useAppCategoryDisplays(mode === 'app');
}

import { useMemo } from 'react';

import {
  type CategoryDisplay,
  useAppCategoryDisplays,
  usePresetDisplays,
} from '@/features/categories/hooks/use-category-display';

import type { CaptureMode } from '../data/capture-store';

/**
 * Categories the parser and pickers work with. In the app: the user's own
 * first, then the presets they haven't added (id = preset key), which a
 * draft may suggest and saving then adds. During onboarding: every preset.
 */
export function useCaptureCategories(mode: CaptureMode): CategoryDisplay[] {
  const app = useAppCategoryDisplays(mode === 'app');
  const presets = usePresetDisplays();
  return useMemo(() => {
    if (mode !== 'app') return presets;
    const owned = new Set(app.map((category) => category.presetId));
    return [...app, ...presets.filter((preset) => !owned.has(preset.presetId))];
  }, [mode, app, presets]);
}

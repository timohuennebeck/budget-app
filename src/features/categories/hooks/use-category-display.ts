import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Category } from '../data/categories-api';
import type { CategoryPreset } from '../data/presets-api';
import { presetKeywords, presetName } from '../lib/category-name';
import { useCategories } from './use-categories';
import { usePresets } from './use-presets';

/** Minimal shape every category list/row/picker renders. */
export interface CategoryDisplay {
  /** Preset id ('fuel') or the uuid of an own category */
  id: string;
  presetId: string | null;
  name: string;
  icon: string;
  hue: number;
  keywords: string[];
  /** Average monthly spend of people the same age, from the preset */
  peerAverage: number | null;
}

function presetDisplay(preset: CategoryPreset): CategoryDisplay {
  return {
    id: preset.id,
    presetId: preset.id,
    name: presetName(preset),
    icon: preset.icon,
    hue: preset.hue,
    keywords: presetKeywords(preset),
    peerAverage: preset.peer_average,
  };
}

function ownDisplay(category: Category): CategoryDisplay {
  return {
    id: category.id,
    presetId: null,
    name: category.name,
    icon: category.icon,
    hue: category.hue,
    keywords: [],
    peerAverage: null,
  };
}

/** Every preset, translated. Available before sign-up. */
export function usePresetDisplays(): CategoryDisplay[] {
  const { data } = usePresets();
  const { i18n } = useTranslation();
  return useMemo(
    () => (data ?? []).map(presetDisplay),
    // Re-translate when the language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, i18n.language],
  );
}

/** Everything a signed-in user can pick: all presets plus their own
 * categories. Archived own categories are left out unless `includeArchived`
 * (old entries still show them). */
export function useAppCategoryDisplays(enabled = true, includeArchived = false): CategoryDisplay[] {
  const presets = usePresetDisplays();
  const { data } = useCategories(enabled);
  return useMemo(
    () => [
      ...presets,
      ...(data ?? [])
        .filter((category) => includeArchived || !category.archived_at)
        .map(ownDisplay),
    ],
    [presets, data, includeArchived],
  );
}

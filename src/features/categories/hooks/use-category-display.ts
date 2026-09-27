import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { Enums } from '@/shared/lib/database.types';

import type { Category } from '../data/categories-api';
import type { CategoryPreset } from '../data/presets-api';
import { presetKeywords, presetName } from '../lib/category-name';
import { useCategories } from './use-categories';
import { usePresets } from './use-presets';

/** Minimal shape every category list/row/picker renders. */
export interface CategoryDisplay {
  /** Preset id ('transport') or the uuid of an own category */
  id: string;
  /** Presets are for expenses or for income; own categories are expenses */
  kind: Enums<'entry_kind'>;
  presetId: string | null;
  name: string;
  icon: string;
  hue: number;
  keywords: string[];
  /** Average monthly spend of people the same age, from the preset */
  peerAverage: number | null;
  /** One of the most common presets, shown first where space is short */
  suggested: boolean;
}

function presetDisplay(preset: CategoryPreset): CategoryDisplay {
  return {
    id: preset.id,
    kind: preset.kind,
    presetId: preset.id,
    name: presetName(preset),
    icon: preset.icon,
    hue: preset.hue,
    keywords: presetKeywords(preset),
    peerAverage: preset.peer_average,
    suggested: preset.suggested,
  };
}

function ownDisplay(category: Category): CategoryDisplay {
  return {
    id: category.id,
    kind: 'expense',
    presetId: null,
    name: category.name,
    icon: category.icon,
    hue: category.hue,
    keywords: [],
    peerAverage: null,
    suggested: false,
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

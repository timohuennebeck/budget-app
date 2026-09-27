import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useSelectedCategoryIds } from '@/features/onboarding/hooks/use-selected-category-ids';
import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';

import type { CategoryPreset } from '../data/presets-api';
import { presetKeywords, presetName } from '../lib/category-name';
import { useCategories } from './use-categories';
import { usePresets } from './use-presets';

/** Minimal shape every category list/row/picker renders. */
export interface CategoryDisplay {
  id: string;
  presetKey: string | null;
  name: string;
  icon: string;
  hue: number;
  keywords: string[];
  /** Average monthly spend of people the same age, from the preset */
  peerAverage: number | null;
}

function usePresetMap() {
  const { data } = usePresets();
  return useMemo(() => new Map((data ?? []).map((preset) => [preset.key, preset])), [data]);
}

function presetDisplay(preset: CategoryPreset): CategoryDisplay {
  return {
    id: preset.key,
    presetKey: preset.key,
    name: presetName(preset),
    icon: preset.icon,
    hue: preset.hue,
    keywords: presetKeywords(preset),
    peerAverage: preset.peer_average,
  };
}

/** The signed-in user's categories, translated and with parser keywords. Archived
 * ones are left out unless `includeArchived` (old entries still show them). */
export function useAppCategoryDisplays(enabled = true, includeArchived = false): CategoryDisplay[] {
  const { data } = useCategories(enabled);
  const presets = usePresetMap();
  const { i18n } = useTranslation();
  return useMemo(
    () =>
      (data ?? [])
        .filter((category) => includeArchived || !category.archived_at)
        .map((category) => {
          const preset = category.preset_key ? presets.get(category.preset_key) : undefined;
          return {
            id: category.id,
            presetKey: category.preset_key,
            // Presets follow the app language; custom names stay as typed.
            name: preset ? presetName(preset) : category.name,
            icon: category.icon,
            hue: category.hue,
            keywords: preset ? presetKeywords(preset) : [],
            peerAverage: preset?.peer_average ?? null,
          };
        }),
    // Re-translate when the language changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, presets, includeArchived, i18n.language],
  );
}

/** Every preset, e.g. for parsing before the user picked any. */
export function usePresetDisplays(): CategoryDisplay[] {
  const { data } = usePresets();
  const { i18n } = useTranslation();
  return useMemo(
    () => (data ?? []).map(presetDisplay),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, i18n.language],
  );
}

/** Onboarding selection (preset keys + custom drafts) in the same shape. */
export function useOnboardingCategoryDisplays(): CategoryDisplay[] {
  const categoryIds = useSelectedCategoryIds();
  const customCategories = useOnboardingStore((state) => state.customCategories);
  const presets = usePresetMap();
  const { i18n } = useTranslation();

  return useMemo(
    () =>
      categoryIds.flatMap((id): CategoryDisplay[] => {
        const preset = presets.get(id);
        if (preset) return [presetDisplay(preset)];
        const custom = customCategories.find((category) => category.id === id);
        return custom ? [{ ...custom, presetKey: null, keywords: [], peerAverage: null }] : [];
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categoryIds, customCategories, presets, i18n.language],
  );
}

import i18n from 'i18next';

import type { CategoryPreset } from '../data/presets-api';

/** The preset's name in the app language, e.g. pt-BR → pt → en. */
export function presetName(preset: Pick<CategoryPreset, 'names'>, language = i18n.language) {
  return preset.names[language] ?? preset.names[language.split('-')[0]] ?? preset.names.en;
}

/** Every keyword of a preset across all languages, for the local parser. */
export function presetKeywords(preset: Pick<CategoryPreset, 'keywords'>) {
  return [...new Set(Object.values(preset.keywords).flat())];
}

// Preset categories are named in the app language so switching it renames
// them; custom categories keep the name the user typed.
export function categoryName(category: { name: string }, preset?: CategoryPreset) {
  return preset ? presetName(preset) : category.name;
}

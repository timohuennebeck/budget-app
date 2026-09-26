import 'expo-sqlite/localStorage/install';

import { getLocales } from 'expo-localization';
import i18n, { changeLanguage as applyLanguage, use as registerPlugin } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { type LanguageCode, languages } from '@/shared/data/languages';

import de from './locales/de.json';
import en from './locales/en.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import it from './locales/it.json';
import pt from './locales/pt.json';
import ptBR from './locales/pt-BR.json';

export const resources = {
  de: { translation: de },
  en: { translation: en },
  es: { translation: es },
  fr: { translation: fr },
  it: { translation: it },
  pt: { translation: pt },
  'pt-BR': { translation: ptBR },
} as const;

const STORAGE_KEY = 'looop-language';
const supported = languages.map((language) => language.code);

// Uses the language picked in the app if there is one, otherwise the best
// match from the device settings: exact tag first (pt-BR), then the bare
// language code, then German as the default.
function initialLanguage(): LanguageCode {
  const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
  if (saved && supported.includes(saved)) return saved;
  for (const locale of getLocales()) {
    const tag = locale.languageTag as LanguageCode;
    if (supported.includes(tag)) return tag;
    const code = locale.languageCode as LanguageCode;
    if (code && supported.includes(code)) return code;
  }
  return 'de';
}

registerPlugin(initReactI18next).init({
  resources,
  lng: initialLanguage(),
  fallbackLng: { 'pt-BR': ['pt', 'en'], default: ['en'] },
  interpolation: { escapeValue: false },
  returnNull: false,
});

export function changeLanguage(code: LanguageCode) {
  localStorage.setItem(STORAGE_KEY, code);
  return applyLanguage(code);
}

export default i18n;

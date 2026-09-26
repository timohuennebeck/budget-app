import type { FlagCode } from '@/shared/ui/flag';

export type LanguageCode = 'de' | 'en' | 'es' | 'fr' | 'it' | 'pt' | 'pt-BR';

export interface Language {
  code: LanguageCode;
  /** Endonym, shown in every UI language */
  name: string;
  flag: FlagCode;
}

export const languages: Language[] = [
  { code: 'de', name: 'Deutsch', flag: 'de' },
  { code: 'en', name: 'English', flag: 'gb' },
  { code: 'es', name: 'Español', flag: 'es' },
  { code: 'fr', name: 'Français', flag: 'fr' },
  { code: 'it', name: 'Italiano', flag: 'it' },
  { code: 'pt', name: 'Português', flag: 'pt' },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: 'br' },
];

export function findLanguage(code: string) {
  return languages.find((language) => language.code === code) ?? languages[0];
}

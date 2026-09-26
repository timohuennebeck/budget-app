import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { languages } from '@/shared/data/languages';
import { changeLanguage } from '@/shared/i18n';

/** Applies the language saved in the profile once it has loaded. */
export function useSyncLanguage(locale: string | undefined) {
  const { i18n } = useTranslation();
  useEffect(() => {
    const language = languages.find((candidate) => candidate.code === locale);
    if (language && language.code !== i18n.language) changeLanguage(language.code);
  }, [locale, i18n]);
}

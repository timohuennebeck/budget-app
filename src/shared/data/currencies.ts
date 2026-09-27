import { getLocales } from 'expo-localization';

import type { FlagCode } from '@/shared/ui/flag';

export interface Currency {
  code: string;
  flag: FlagCode;
}

// Names come from the locale files (currencies.<code>) so they follow the app language.
export const currencies: Currency[] = [
  { code: 'EUR', flag: 'eu' },
  { code: 'CHF', flag: 'ch' },
  { code: 'USD', flag: 'us' },
  { code: 'GBP', flag: 'gb' },
];

/** The phone's currency when the app supports it (e.g. CHF in Switzerland), else EUR. */
export function deviceCurrency() {
  const supported = new Set(currencies.map((currency) => currency.code));
  const match = getLocales().find(
    (locale) => locale.currencyCode && supported.has(locale.currencyCode),
  );
  return match?.currencyCode ?? 'EUR';
}

import type { FlagCode } from '@/shared/ui/flag';

export interface Currency {
  code: string;
  flag: FlagCode;
}

// Names come from Intl.DisplayNames so they follow the app language.
export const currencies: Currency[] = [
  { code: 'EUR', flag: 'eu' },
  { code: 'CHF', flag: 'ch' },
  { code: 'USD', flag: 'us' },
  { code: 'GBP', flag: 'gb' },
];

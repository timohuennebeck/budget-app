import { t } from 'i18next';

import type { CategoryDisplay } from '@/features/categories/hooks/use-category-display';
import { formatTime } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';

import type { Entry } from '../data/entries-api';

const INCOME_VISUAL = { icon: 'briefcase', hue: 150 };
const UNKNOWN_VISUAL = { icon: 'sparkle', hue: 255 };

interface EntryLike {
  kind: Entry['kind'];
  amount: number;
  total_amount?: number | null;
  is_favorite?: boolean;
  occurred_at?: string;
}

/** Icon and hue for a row: category colours, briefcase for income. */
export function entryVisual(
  kind: Entry['kind'],
  category?: Pick<CategoryDisplay, 'icon' | 'hue'> | null,
) {
  if (kind === 'income') return INCOME_VISUAL;
  return category ? { icon: category.icon, hue: category.hue } : UNKNOWN_VISUAL;
}

/** "Essen gehen · halbe-halbe", "Café · Favorit" or "Mobilität · 09:12". */
export function entrySubtitle(entry: EntryLike, categoryLabel: string | undefined) {
  const label =
    entry.kind === 'income' ? t('entries.income') : (categoryLabel ?? t('entries.noCategory'));
  const detail = entry.total_amount
    ? t('entries.split')
    : entry.is_favorite
      ? t('entries.favorite')
      : entry.occurred_at
        ? formatTime(new Date(entry.occurred_at))
        : null;
  return detail ? `${label} · ${detail}` : label;
}

/** Signed amount: "−23,00 €" for expenses, "+650,00 €" for income. */
export function entryAmount(entry: Pick<EntryLike, 'kind' | 'amount'>, currency: string) {
  const signed = entry.kind === 'income' ? Number(entry.amount) : -Number(entry.amount);
  return formatMoney(signed, { currency, signed: true });
}

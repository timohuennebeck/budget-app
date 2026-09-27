import { categoryIdOf } from '@/features/categories/lib/category-ref';
import type { Entry } from '@/features/entries/data/entries-api';
import { matchCategory, newDraftId } from '@/features/capture/lib/parse-entries';
import type { CategoryOption, DraftEntry } from '@/features/capture/lib/types';
import { roundMoney } from '@/shared/lib/money';

/** One Apple Pay payment as the App Intent noted it. */
export interface WalletPayment {
  id: string;
  amount: number;
  currency: string;
  merchant: string;
  /** ISO date-time of the payment */
  date: string;
}

export function parsePayments(value: unknown): WalletPayment[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is WalletPayment =>
      typeof item?.id === 'string' &&
      typeof item.amount === 'number' &&
      item.amount > 0 &&
      typeof item.merchant === 'string' &&
      typeof item.date === 'string',
  );
}

/**
 * Drafts for the review screen. A merchant the user filed before keeps that
 * category; otherwise the preset keywords (which include merchants like
 * "rewe" or "aral") decide. Without either, the review asks.
 */
export function paymentDrafts(
  payments: WalletPayment[],
  categories: CategoryOption[],
  recent: Entry[],
): DraftEntry[] {
  const known = new Map<string, string>();
  for (const entry of recent) {
    const categoryId = categoryIdOf(entry);
    const key = entry.title.toLowerCase();
    if (categoryId && !known.has(key)) known.set(key, categoryId);
  }
  return payments.map((payment) => {
    const title = payment.merchant.trim() || 'Apple Pay';
    const categoryId =
      known.get(title.toLowerCase()) ??
      matchCategory(
        title,
        categories.filter((option) => option.kind === 'expense'),
      )?.id ??
      null;
    return {
      id: newDraftId(),
      title,
      amount: roundMoney(payment.amount),
      kind: 'expense',
      categoryId,
      source: 'wallet',
      occurredAt: payment.date,
      uncertain: categoryId === null,
      paymentId: payment.id,
    };
  });
}

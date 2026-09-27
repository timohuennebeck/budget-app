import { parseAmount, roundMoney } from '@/shared/lib/money';

import type { CategoryOption, DraftEntry } from './types';

// On-device parser: turns "40€ Lebensmittel, 12€ Uber, Mittagessen 18€" into
// draft entries. Used before sign-up and whenever the parse-capture edge
// function can't be reached (offline, daily AI limit, errors).

const SEPARATORS = /\s*(?:,|;|\n|\s+und\s+|\s+and\s+|\s+y\s+|\s+et\s+|\s+e\s+)\s*/i;
const AMOUNT =
  /(?:(€|\$|£|chf|fr\.)\s*)?(\d+(?:[.,]\d{1,2})?)\s*(€|eur(?:o|os)?|\$|usd|£|gbp|chf|fr\.?)?/i;
const INCOME =
  /\b(gehalt|lohn|einnahme|erstattung|freelance|salary|income|refund|ingreso|sueldo|salaire|revenu|stipendio|entrata|salário|receita)\b/i;
const FILLER = /\b(für|fuer|bei|im|in|am|beim|for|at|on|para|en|pour|chez|per|da|no|na|em)\b/gi;

export interface ParseResult {
  entries: DraftEntry[];
  /** Pieces of text without a recognisable amount */
  unrecognized: string[];
}

interface ParseOptions {
  source: DraftEntry['source'];
  now?: Date;
}

let counter = 0;
export const newDraftId = () => `draft-${Date.now().toString(36)}-${(counter++).toString(36)}`;

function matchCategory(text: string, categories: CategoryOption[]) {
  const haystack = ` ${text.toLowerCase()} `;
  for (const category of categories) {
    const words = [category.name.toLowerCase(), ...category.keywords];
    if (words.some((word) => word && haystack.includes(` ${word}`))) return category;
  }
  return null;
}

function cleanTitle(segment: string, amountText: string) {
  const title = segment
    .replace(amountText, ' ')
    .replace(FILLER, ' ')
    .replace(/(^|\s)[+\-–](?=\s|$)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (title.length <= 2) return title;
  return title[0].toUpperCase() + title.slice(1);
}

export function parseEntries(
  text: string,
  categories: CategoryOption[],
  { source, now = new Date() }: ParseOptions,
): ParseResult {
  // Drop thousands separators ("2.450,00", "1,234.56"), then turn decimal
  // commas into dots so splitting on commas can't cut amounts in half.
  const protectedText = text
    .replace(/(\d)[.,](\d{3})(?=[.,]\d{1,2}(?!\d)|[^\d.,]|$)/g, '$1$2')
    .replace(/(\d),(\d{1,2})(?!\d)/g, '$1.$2');
  const segments = protectedText
    .split(SEPARATORS)
    .map((part) => part.trim())
    .filter(Boolean);

  const entries: DraftEntry[] = [];
  const unrecognized: string[] = [];

  for (const segment of segments) {
    const match = segment.match(AMOUNT);
    const value = match ? parseAmount(match[2]) : null;
    if (!match || !value) {
      unrecognized.push(segment);
      continue;
    }

    const isIncome = INCOME.test(segment) || /^\+/.test(segment);
    const category = isIncome ? null : matchCategory(segment, categories);
    const title = cleanTitle(segment, match[0]);

    entries.push({
      id: newDraftId(),
      title: title || category?.name || '',
      amount: value,
      kind: isIncome ? 'income' : 'expense',
      categoryId: category?.id ?? null,
      source,
      occurredAt: now.toISOString(),
      uncertain: !isIncome && !category,
    });
  }

  // "Lebensmittel" alone reads better as the category name than lower-cased.
  for (const entry of entries) {
    const category = categories.find((option) => option.id === entry.categoryId);
    if (category && entry.title.toLowerCase() === category.name.toLowerCase())
      entry.title = category.name;
    if (!entry.title) entry.title = category?.name ?? '—';
  }

  return { entries, unrecognized };
}

export function draftsTotal(drafts: Pick<DraftEntry, 'amount' | 'kind'>[]) {
  return roundMoney(
    drafts.reduce((sum, draft) => (draft.kind === 'expense' ? sum + draft.amount : sum), 0),
  );
}

import type { ParseInput } from './providers/types.ts';

// Instructions and output schema shared by every provider.

export const instructions = `You turn a short spending note, a spoken sentence or a receipt photo into ledger entries for a personal budgeting app.

Rules:
- One entry per purchase or income mentioned. Ignore anything without an amount.
- amount is a positive number in the user's currency, with at most two decimals. Spoken numbers ("dreiundzwanzig") count.
- kind is "income" for salary, refunds, freelance pay and money received; otherwise "expense".
- title is short (the merchant or item, max 40 characters) in the user's language, capitalised like a name ("REWE", "Mittagessen", "Uber").
- category_id must be one of the given category ids, or null when none fits. Income always has null.
- Prefer the user's own categories. Use a category marked "new" only when none of the user's own categories fits.
- Use the merchant hints: a merchant the user filed before goes to the same category.
- confident is false when the category is a guess the user should check.
- occurred_at is an ISO 8601 date-time with the user's UTC offset, only when the note names a day or time ("gestern", "Montag", "heute Morgen"), relative to the user's local time. A day without a time means 12:00 that day. Otherwise null.
- A receipt is one entry: the store name and the total paid (not subtotals or tax lines).
- Never invent amounts. If nothing is recognisable, return an empty list.`;

export function userPrompt(input: ParseInput) {
  const categories = input.categories.map((category) => ({
    id: category.id,
    name: category.name,
    examples: category.keywords.slice(0, 12),
    ...(category.isNew ? { new: true } : {}),
  }));
  return [
    `User language: ${input.locale}. Currency: ${input.currency}. Local time: ${input.localNow}.`,
    `Categories: ${JSON.stringify(categories)}`,
    input.hints.length ? `Merchant hints: ${JSON.stringify(input.hints)}` : '',
    input.text ? `Note: """${input.text}"""` : 'The receipt photo is attached.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Strict JSON schema; category_id can only be one of the user's ids. */
export function entriesSchema(categoryIds: string[]) {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['entries'],
    properties: {
      entries: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['title', 'amount', 'kind', 'category_id', 'occurred_at', 'confident'],
          properties: {
            title: { type: 'string' },
            amount: { type: 'number' },
            kind: { type: 'string', enum: ['expense', 'income'] },
            category_id: { type: ['string', 'null'], enum: [...categoryIds, null] },
            occurred_at: { type: ['string', 'null'] },
            confident: { type: 'boolean' },
          },
        },
      },
    },
  };
}

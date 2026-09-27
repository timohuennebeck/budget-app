import { categoryColumns } from '@/features/categories/lib/category-ref';

import type { DraftEntry } from './types';

/** The entries columns for a reviewed draft; the caller adds id or profile_id. */
export function draftRow(draft: DraftEntry) {
  return {
    title: draft.title,
    amount: draft.amount,
    kind: draft.kind,
    source: draft.source,
    occurred_at: draft.occurredAt,
    capture_id: draft.captureId ?? null,
    ...categoryColumns(draft.categoryId),
  };
}

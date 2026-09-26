import type { Enums } from '@/shared/lib/database.types';

/** A parsed but not yet saved entry. */
export interface DraftEntry {
  id: string;
  title: string;
  /** The user's share */
  amount: number;
  /** Full bill when it was split, otherwise null */
  totalAmount: number | null;
  kind: Enums<'entry_kind'>;
  /** Category id in the app, catalog key during onboarding */
  categoryId: string | null;
  source: Enums<'entry_source'>;
  occurredAt: string;
  /** Pip wasn't sure about the category; the review step asks to confirm */
  uncertain: boolean;
}

/** What the parser needs to know about a category to match it. */
export interface CategoryOption {
  id: string;
  name: string;
  keywords: string[];
}

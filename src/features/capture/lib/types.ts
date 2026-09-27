import type { Enums } from '@/shared/lib/database.types';

/** A parsed but not yet saved entry. */
export interface DraftEntry {
  id: string;
  title: string;
  /** The user's share */
  amount: number;
  kind: Enums<'entry_kind'>;
  /** Category id in the app, preset id during onboarding */
  categoryId: string | null;
  source: Enums<'entry_source'>;
  occurredAt: string;
  /** Pip wasn't sure about the category; the review step asks to confirm */
  uncertain: boolean;
  /** The AI capture it came from, saved as entries.capture_id */
  captureId?: string;
  /** The Apple Pay payment it came from; cleared from the inbox once saved */
  paymentId?: string;
}

/** What the parser needs to know about a category to match it. */
export interface CategoryOption {
  id: string;
  /** Presets are for expenses or for income; own categories are expenses */
  kind: Enums<'entry_kind'>;
  name: string;
  keywords: string[];
}

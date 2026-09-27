// The contract every AI provider implements. parse-capture only talks to
// this interface, so adding a provider means one new file in this folder.

export interface CategoryChoice {
  id: string;
  name: string;
  keywords: string[];
  /** A preset the user hasn't added yet; saving an entry with it adds it */
  isNew?: boolean;
}

export interface MerchantHint {
  title: string;
  categoryId: string;
}

export interface ParseInput {
  /** Typed or transcribed text; absent for receipt photos */
  text?: string;
  /** Receipt photo as a data URL (data:image/jpeg;base64,…) */
  image?: string;
  categories: CategoryChoice[];
  hints: MerchantHint[];
  currency: string;
  locale: string;
  /** The user's local date, time and offset, e.g. "Monday, 28/09/2026, 19:40 GMT+02:00" */
  localNow: string;
}

export interface ParsedEntry {
  title: string;
  amount: number;
  kind: 'expense' | 'income';
  category_id: string | null;
  /** ISO date-time when the text names a day or time, otherwise null */
  occurred_at: string | null;
  /** False when the category is a guess the user should confirm */
  confident: boolean;
}

export interface ParseOutput {
  entries: ParsedEntry[];
  inputTokens: number | null;
  outputTokens: number | null;
}

export interface CaptureProvider {
  parse(input: ParseInput, model: string): Promise<ParseOutput>;
}

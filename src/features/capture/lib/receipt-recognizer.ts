import type { CategoryOption } from './types';
import { parseEntries } from './parse-entries';

export class ReceiptUnreadableError extends Error {
  constructor(readonly code = 422) {
    super('Receipt could not be read');
  }
}

// Stub until receipt OCR runs on a backend: waits like a network call and
// returns a typical supermarket receipt. Replace the body with an upload to
// an Edge Function that returns the same text format.
export async function recognizeReceipt(uri: string | null, categories: CategoryOption[]) {
  await new Promise((resolve) => setTimeout(resolve, 1200));
  if (!uri) throw new ReceiptUnreadableError();

  const { entries } = parseEntries('REWE 31,40, BVG 3,20, dm 16,90', categories, {
    source: 'camera',
  });
  if (entries.length === 0) throw new ReceiptUnreadableError();
  return entries;
}

import { useMemo } from 'react';

import type { CaptureMode } from '../data/capture-store';
import { draftsTotal, parseEntries } from '../lib/parse-entries';
import { useCaptureCategories } from './use-capture-categories';

/** Live "3 Einträge erkannt · 84 €" while the user types or speaks. */
export function useParsePreview(text: string, mode: CaptureMode) {
  const categories = useCaptureCategories(mode);
  return useMemo(() => {
    const result = parseEntries(text, categories, { source: 'text' });
    return { ...result, count: result.entries.length, total: draftsTotal(result.entries) };
  }, [text, categories]);
}

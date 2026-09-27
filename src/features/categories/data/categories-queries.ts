import { createQueryKeys } from '@lukemorales/query-key-factory';

import { fetchCategories } from './categories-api';
import { fetchLimits } from './limits-api';
import { fetchPresets } from './presets-api';

export const categoryQueries = createQueryKeys('categories', {
  list: { queryKey: null, queryFn: fetchCategories },
});

export const presetQueries = createQueryKeys('categories-presets', {
  list: { queryKey: null, queryFn: fetchPresets },
});

export const limitQueries = createQueryKeys('categories-limits', {
  list: { queryKey: null, queryFn: fetchLimits },
});

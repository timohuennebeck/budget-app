import { createQueryKeys } from '@lukemorales/query-key-factory';

import { fetchCategories } from './categories-api';
import { fetchPresets } from './presets-api';

export const categoryQueries = createQueryKeys('categories', {
  list: { queryKey: null, queryFn: fetchCategories },
});

export const presetQueries = createQueryKeys('categories-presets', {
  list: { queryKey: null, queryFn: fetchPresets },
});

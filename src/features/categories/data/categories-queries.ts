import { createQueryKeys } from '@lukemorales/query-key-factory';

import { fetchCategories } from './categories-api';

export const categoryQueries = createQueryKeys('categories', {
  list: { queryKey: null, queryFn: fetchCategories },
});

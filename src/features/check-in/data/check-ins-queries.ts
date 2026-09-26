import { createQueryKeys } from '@lukemorales/query-key-factory';

import { fetchCheckIns } from './check-ins-api';

export const checkInQueries = createQueryKeys('check-ins', {
  list: { queryKey: null, queryFn: fetchCheckIns },
});

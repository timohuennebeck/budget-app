import { useQuery } from '@tanstack/react-query';

import { presetQueries } from '../data/categories-queries';

/** Built-in categories; they only change with a migration. */
export function usePresets() {
  return useQuery({ ...presetQueries.list, staleTime: Infinity });
}

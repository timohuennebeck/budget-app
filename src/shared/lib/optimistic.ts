import type { QueryClient, QueryFilters, QueryKey } from '@tanstack/react-query';

export type CacheSnapshot = [QueryKey, unknown][];

/** Stops in-flight fetches and remembers the cached data for a rollback. */
export async function snapshot(client: QueryClient, filters: QueryFilters) {
  await client.cancelQueries(filters);
  return client.getQueriesData(filters) as CacheSnapshot;
}

export function restore(client: QueryClient, saved: CacheSnapshot | undefined) {
  saved?.forEach(([key, data]) => client.setQueryData(key, data));
}

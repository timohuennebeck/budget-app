import { createQueryKeys } from '@lukemorales/query-key-factory';
import type { QueryClient } from '@tanstack/react-query';

import type { DateRange } from '@/shared/lib/dates';

import {
  type Entry,
  fetchEntries,
  fetchEntriesAllowance,
  fetchEntry,
  fetchEntryStats,
  fetchLastWalletPayment,
} from './entries-api';

export const entryQueries = createQueryKeys('entries', {
  range: ({ start, end }: DateRange) => ({
    queryKey: [start.toISOString(), end.toISOString()],
    queryFn: () => fetchEntries({ start, end }),
  }),
  detail: (id: string) => ({ queryKey: [id], queryFn: () => fetchEntry(id) }),
  stats: { queryKey: null, queryFn: fetchEntryStats },
  lastWallet: { queryKey: null, queryFn: fetchLastWalletPayment },
  allowance: (periodStart: string) => ({
    queryKey: [periodStart],
    queryFn: () => fetchEntriesAllowance(periodStart),
  }),
});

const byNewest = (a: Entry, b: Entry) => b.occurred_at.localeCompare(a.occurred_at);

// Range keys look like ['entries', 'range', startISO, endISO].
function inRange(key: readonly unknown[], entry: Entry) {
  const [, , start, end] = key as string[];
  const at = new Date(entry.occurred_at).getTime();
  return at >= new Date(start).getTime() && at < new Date(end).getTime();
}

/** An entry from any cached list, with when that list was fetched. */
export function findCachedEntry(client: QueryClient, id: string) {
  for (const [key, list] of client.getQueriesData<Entry[]>({
    queryKey: entryQueries.range._def,
  })) {
    const entry = list?.find((candidate) => candidate.id === id);
    if (entry) return { entry, updatedAt: client.getQueryState(key)?.dataUpdatedAt };
  }
  return undefined;
}

/** Drops the given entries from every cached list, then re-adds `upserts` where they fit. */
export function writeEntryLists(client: QueryClient, removeIds: string[], upserts: Entry[] = []) {
  const removed = new Set(removeIds);
  for (const [key, list] of client.getQueriesData<Entry[]>({
    queryKey: entryQueries.range._def,
  })) {
    if (!list) continue;
    const kept = list.filter((entry) => !removed.has(entry.id));
    const added = upserts.filter((entry) => inRange(key, entry));
    client.setQueryData(key, [...kept, ...added].sort(byNewest));
  }
}

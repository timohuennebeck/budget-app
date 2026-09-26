import { type QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '@/features/auth/lib/auth-provider';
import { addDays, budgetCycle, type DateRange, startOfDay } from '@/shared/lib/dates';
import { restore, snapshot } from '@/shared/lib/optimistic';

import {
  deleteEntry,
  type Entry,
  type EntryInsert,
  type EntryUpdate,
  insertEntries,
  updateEntry,
} from '../data/entries-api';
import { entryQueries, writeEntryLists } from '../data/entries-queries';

export function useEntries(range: DateRange, enabled = true) {
  return useQuery({ ...entryQueries.range(range), enabled });
}

/** Entries of the last 30 days including today, for category hints. */
export function useRecentEntries(enabled = true) {
  const end = addDays(startOfDay(new Date()), 1);
  return useEntries({ start: addDays(end, -30), end }, enabled);
}

export function useEntry(id: string) {
  return useQuery({ ...entryQueries.detail(id), enabled: !!id });
}

export function useEntryDates(enabled = true) {
  return useQuery({ ...entryQueries.dates, enabled });
}

/** Entries created in the current budget month, for the free plan limit. */
export function useMonthlyEntryCount(monthStartDay = 1) {
  return useQuery(entryQueries.count(budgetCycle(new Date(), monthStartDay)));
}

/** New entries carry their id (expo-crypto randomUUID) so the cache can show them at once. */
export type NewEntry = Omit<EntryInsert, 'profile_id'> & { id: string };

// Every entry mutation shows its result right away, rolls back on error
// and refetches the active entry queries once the server has answered.
function useEntryMutation<T>(
  mutationFn: (variables: T) => Promise<unknown>,
  apply: (client: QueryClient, variables: T) => void,
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    meta: { optimistic: true },
    onMutate: async (variables: T) => {
      const saved = await snapshot(client, { queryKey: entryQueries._def });
      apply(client, variables);
      return { saved };
    },
    onError: (_error, _variables, context) => restore(client, context?.saved),
    onSettled: () => client.invalidateQueries({ queryKey: entryQueries._def }),
  });
}

export function useCreateEntries() {
  const userId = useUserId();
  return useEntryMutation(
    (rows: NewEntry[]) => insertEntries(rows.map((row) => ({ ...row, profile_id: userId }))),
    (client, rows) => {
      const now = new Date().toISOString();
      const entries = rows.map<Entry>((row) => ({
        kind: 'expense',
        category_id: null,
        total_amount: null,
        is_favorite: false,
        source: 'manual',
        occurred_at: now,
        ...row,
        profile_id: userId,
        created_at: now,
        updated_at: now,
      }));
      writeEntryLists(client, [], entries);
      client.setQueriesData<number>({ queryKey: entryQueries.count._def }, (count) =>
        count === undefined ? count : count + rows.length,
      );
    },
  );
}

export function useUpdateEntry() {
  return useEntryMutation(
    ({ id, patch }: { id: string; patch: EntryUpdate }) => updateEntry(id, patch),
    (client, { id, patch }) => {
      const detailKey = entryQueries.detail(id).queryKey;
      const cached =
        client.getQueryData<Entry>(detailKey) ??
        client
          .getQueriesData<Entry[]>({ queryKey: entryQueries.range._def })
          .flatMap(([, list]) => list ?? [])
          .find((entry) => entry.id === id);
      if (!cached) return;
      const updated = { ...cached, ...patch } as Entry;
      client.setQueryData(detailKey, updated);
      writeEntryLists(client, [id], [updated]);
    },
  );
}

/** Callers leave the detail screen first, so its query is inactive and not refetched. */
export function useDeleteEntry() {
  return useEntryMutation(deleteEntry, (client, id: string) => writeEntryLists(client, [id]));
}

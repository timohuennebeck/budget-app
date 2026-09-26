import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '@/features/auth/lib/auth-provider';
import { addDays, budgetCycle, type DateRange, startOfDay } from '@/shared/lib/dates';

import {
  countEntries,
  deleteEntry,
  type EntryInsert,
  type EntryUpdate,
  fetchEntries,
  fetchEntry,
  fetchEntryDates,
  insertEntries,
  updateEntry,
} from '../data/entries-api';

export const entriesKey = ['entries'] as const;

export function useEntries(range: DateRange, enabled = true) {
  return useQuery({
    queryKey: [...entriesKey, 'range', range.start.toISOString(), range.end.toISOString()],
    queryFn: () => fetchEntries(range),
    enabled,
  });
}

/** Entries of the last 30 days including today, for category hints. */
export function useRecentEntries(enabled = true) {
  const end = addDays(startOfDay(new Date()), 1);
  return useEntries({ start: addDays(end, -30), end }, enabled);
}

export function useEntry(id: string) {
  return useQuery({
    queryKey: [...entriesKey, 'detail', id],
    queryFn: () => fetchEntry(id),
    enabled: !!id,
  });
}

export function useEntryDates(enabled = true) {
  return useQuery({ queryKey: [...entriesKey, 'dates'], queryFn: fetchEntryDates, enabled });
}

/** Entries created in the current budget month, for the free plan limit. */
export function useMonthlyEntryCount(monthStartDay = 1) {
  const cycle = budgetCycle(new Date(), monthStartDay);
  return useQuery({
    queryKey: [...entriesKey, 'count', cycle.start.toISOString()],
    queryFn: () => countEntries(cycle),
  });
}

function useInvalidateEntries() {
  const client = useQueryClient();
  return () => client.invalidateQueries({ queryKey: entriesKey });
}

export function useCreateEntries() {
  const userId = useUserId();
  const invalidate = useInvalidateEntries();
  return useMutation({
    mutationFn: (rows: Omit<EntryInsert, 'profile_id'>[]) =>
      insertEntries(rows.map((row) => ({ ...row, profile_id: userId }))),
    onSuccess: invalidate,
  });
}

export function useUpdateEntry() {
  const invalidate = useInvalidateEntries();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: EntryUpdate }) => updateEntry(id, patch),
    onSuccess: invalidate,
  });
}

export function useDeleteEntry() {
  const invalidate = useInvalidateEntries();
  return useMutation({ mutationFn: deleteEntry, onSuccess: invalidate });
}

import { useEntries } from '@/features/entries/hooks/use-entries';
import { sumExpenses } from '@/features/entries/lib/entry-stats';
import { toISODate } from '@/shared/lib/dates';

import { currentCheckInWindow, lastClosedWindow } from '../lib/check-in-window';
import { useCheckIns } from './use-check-ins';

const DAY = 86_400_000;

export type CheckInStatus = 'open' | 'done' | 'locked' | 'missed';

/** Everything the check-in card and screens need about the current week. */
export function useCheckInState(now = new Date()) {
  const window = currentCheckInWindow(now);
  const checkInsQuery = useCheckIns();
  const entriesQuery = useEntries(window.week);
  const checkIns = checkInsQuery.data ?? [];
  const entries = entriesQuery.data ?? [];

  const weekStart = toISODate(window.week.start);
  const current = checkIns.find((checkIn) => checkIn.week_start === weekStart);
  const lastClosed = checkIns.find(
    (checkIn) => checkIn.week_start === toISODate(lastClosedWindow(now).week.start),
  );
  const previous = checkIns.find(
    (checkIn) => checkIn.week_start < weekStart && checkIn.guess !== null,
  );

  let status: CheckInStatus;
  if (current) status = 'done';
  else if (window.isOpen) status = 'open';
  else status = lastClosed || checkIns.length === 0 ? 'locked' : 'missed';

  return {
    isLoading: checkInsQuery.isPending || entriesQuery.isPending,
    window,
    status,
    current,
    previous,
    entries,
    expenseCount: entries.filter((entry) => entry.kind === 'expense').length,
    actual: sumExpenses(entries),
    /** Whole days until an open check-in closes, at least 1 */
    daysLeft: Math.max(1, Math.ceil((window.closesAt.getTime() - now.getTime()) / DAY)),
  };
}

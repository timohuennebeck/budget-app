import { addDays, fromISODate } from '@/shared/lib/dates';

import type { CheckIn } from '../data/check-ins-api';
import { checkInAccuracy } from './check-in-window';

/** Filter on Check-ins: everything, the last 3 months, one year (chips) or
 * one month (month pill; the 1st of that month). */
export type CheckInPeriod = 'all' | 'recent' | number | Date;

export interface CheckInMonth {
  key: string;
  /** Sunday of the first week, whose month names the group */
  date: Date;
  checkIns: CheckIn[];
}

export const weekOf = (checkIn: Pick<CheckIn, 'week_start'>) => {
  const start = fromISODate(checkIn.week_start);
  return { start, end: addDays(start, 7) };
};

// A week belongs to the month its Sunday is in ("31. Aug.–6. Sep." is September).
const sundayOf = (checkIn: CheckIn) => addDays(fromISODate(checkIn.week_start), 6);

/** Years with check-ins, newest first, for the year chips. */
export function checkInYears(checkIns: CheckIn[]) {
  return [...new Set(checkIns.map((checkIn) => sundayOf(checkIn).getFullYear()))].sort(
    (a, b) => b - a,
  );
}

/** Average accuracy (0…1) of the check-ins that weren't skipped, or null. */
export function averageAccuracy(checkIns: CheckIn[]) {
  const values = checkIns.flatMap((checkIn) => checkInAccuracy(checkIn) ?? []);
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
}

export function filterCheckIns(checkIns: CheckIn[], period: CheckInPeriod, now = new Date()) {
  const since = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  return checkIns.filter((checkIn) => {
    const sunday = sundayOf(checkIn);
    if (period === 'recent' && sunday < since) return false;
    if (typeof period === 'number' && sunday.getFullYear() !== period) return false;
    if (
      period instanceof Date &&
      (sunday.getFullYear() !== period.getFullYear() || sunday.getMonth() !== period.getMonth())
    )
      return false;
    return true;
  });
}

/** Newest first, one group per month. */
export function groupByMonth(checkIns: CheckIn[]): CheckInMonth[] {
  const groups: CheckInMonth[] = [];
  for (const checkIn of [...checkIns].sort((a, b) => b.week_start.localeCompare(a.week_start))) {
    const sunday = sundayOf(checkIn);
    const key = `${sunday.getFullYear()}-${sunday.getMonth()}`;
    const group = groups.at(-1);
    if (group?.key === key) group.checkIns.push(checkIn);
    else groups.push({ key, date: sunday, checkIns: [checkIn] });
  }
  return groups;
}

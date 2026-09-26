import { addDays, formatDayLabel, startOfDay } from '@/shared/lib/dates';
import { roundMoney } from '@/shared/lib/money';

import type { Entry } from '../data/entries-api';

type Amounted = Pick<Entry, 'amount' | 'kind'>;

export function sumExpenses(entries: Amounted[]) {
  return roundMoney(
    entries.reduce(
      (sum, entry) => (entry.kind === 'expense' ? sum + Number(entry.amount) : sum),
      0,
    ),
  );
}

/** Expenses minus income, as shown in the day headers of "Einträge". */
export function netTotal(entries: Amounted[]) {
  return roundMoney(
    entries.reduce(
      (sum, entry) => sum + (entry.kind === 'income' ? 1 : -1) * Number(entry.amount),
      0,
    ),
  );
}

export function spendByCategory(entries: Pick<Entry, 'amount' | 'kind' | 'category_id'>[]) {
  const totals = new Map<string, number>();
  for (const entry of entries) {
    if (entry.kind !== 'expense' || !entry.category_id) continue;
    totals.set(
      entry.category_id,
      roundMoney((totals.get(entry.category_id) ?? 0) + Number(entry.amount)),
    );
  }
  return totals;
}

export function countByCategory(entries: Pick<Entry, 'category_id'>[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (entry.category_id) counts.set(entry.category_id, (counts.get(entry.category_id) ?? 0) + 1);
  }
  return counts;
}

export interface DayGroup {
  key: string;
  label: string;
  date: Date;
  total: number;
  entries: Entry[];
}

/** Groups entries (newest first) into "Heute", "Gestern", "24. September"… */
export function groupByDay(entries: Entry[], now = new Date()): DayGroup[] {
  const groups = new Map<string, DayGroup>();
  for (const entry of entries) {
    const date = startOfDay(new Date(entry.occurred_at));
    const key = date.toISOString();
    const group = groups.get(key) ?? {
      key,
      date,
      label: formatDayLabel(date, now),
      total: 0,
      entries: [],
    };
    group.entries.push(entry);
    groups.set(key, group);
  }
  return [...groups.values()].map((group) => ({ ...group, total: netTotal(group.entries) }));
}

/** Consecutive days with at least one entry, ending today or yesterday. */
export function streakDays(dates: Date[], now = new Date()) {
  const days = new Set(dates.map((date) => startOfDay(date).getTime()));
  let cursor = startOfDay(now);
  if (!days.has(cursor.getTime())) cursor = addDays(cursor, -1);
  let streak = 0;
  while (days.has(cursor.getTime())) {
    streak++;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

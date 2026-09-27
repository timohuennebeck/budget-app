import type { Entry } from '@/features/entries/data/entries-api';
import { addDays, daysBetween, type DateRange, startOfDay } from '@/shared/lib/dates';
import { roundMoney } from '@/shared/lib/money';

export type TrendStatus = 'under' | 'onTrack' | 'ahead' | 'over' | 'noLimit';

export interface CategoryTrend {
  /** Days in the budget cycle */
  days: number;
  /** Days so far, today included */
  elapsed: number;
  daysLeft: number;
  /** Spent up to the end of each day so far (length = elapsed) */
  cumulative: number[];
  spent: number;
  limit: number | null;
  /** Where the current pace ends the cycle */
  projected: number;
  status: TrendStatus;
}

// Within ±5 % of the limit counts as on plan.
const TOLERANCE = 0.05;

/**
 * The running total of one category through the budget cycle, the pace it
 * implies and how that compares with the limit (2w-e).
 */
export function categoryTrend(
  entries: Entry[],
  cycle: DateRange,
  limit: number | null,
  now = new Date(),
): CategoryTrend {
  const days = Math.max(1, daysBetween(cycle.start, cycle.end));
  const elapsed = Math.min(days, Math.max(1, daysBetween(cycle.start, startOfDay(now)) + 1));

  const perDay = new Array<number>(elapsed).fill(0);
  for (const entry of entries) {
    if (entry.kind !== 'expense') continue;
    const index = daysBetween(cycle.start, startOfDay(new Date(entry.occurred_at)));
    // Entries dated later this cycle count today, as they do on the budget card.
    if (index >= 0 && index < days) perDay[Math.min(index, elapsed - 1)] += Number(entry.amount);
  }
  let running = 0;
  const cumulative = perDay.map((amount) => (running = roundMoney(running + amount)));
  const spent = cumulative[cumulative.length - 1] ?? 0;
  const projected = roundMoney((spent / elapsed) * days);

  let status: TrendStatus = 'noLimit';
  if (limit !== null) {
    if (spent > limit) status = 'over';
    else if (projected > limit * (1 + TOLERANCE)) status = 'ahead';
    else if (projected < limit * (1 - TOLERANCE)) status = 'under';
    else status = 'onTrack';
  }

  return { days, elapsed, daysLeft: days - elapsed, cumulative, spent, limit, projected, status };
}

/** Day labels along the x axis: the cycle's first day and every 7th, plus the last. */
export function trendTicks(cycle: DateRange, days: number) {
  const ticks: { index: number; label: string }[] = [];
  for (let index = 0; index < days; index += 7) {
    if (days - 1 - index < 4 && index !== 0) break;
    ticks.push({ index, label: `${addDays(cycle.start, index).getDate()}.` });
  }
  ticks.push({ index: days - 1, label: `${addDays(cycle.start, days - 1).getDate()}.` });
  return ticks;
}

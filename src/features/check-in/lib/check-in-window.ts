import { addDays, type DateRange, weekRange } from '@/shared/lib/dates';

import type { CheckIn } from '../data/check-ins-api';

export interface CheckInWindow {
  /** Monday–Sunday week the check-in is about */
  week: DateRange;
  opensAt: Date;
  closesAt: Date;
  isOpen: boolean;
}

const OPEN_HOUR = 18;

function windowForWeek(week: DateRange): Omit<CheckInWindow, 'isOpen'> {
  const opensAt = addDays(week.start, 6);
  opensAt.setHours(OPEN_HOUR, 0, 0, 0);
  const closesAt = addDays(week.end, 2);
  return { week, opensAt, closesAt };
}

function windowWeeksAgo(now: Date, weeks: number) {
  const start = addDays(weekRange(now).start, -7 * weeks);
  return windowForWeek({ start, end: addDays(start, 7) });
}

// The check-in for a week opens Sunday 18:00 and stays open until Tuesday
// night. Returns the window that is open now, or otherwise the next one.
export function currentCheckInWindow(now = new Date()): CheckInWindow {
  const previous = windowWeeksAgo(now, 1);
  if (now >= previous.opensAt && now < previous.closesAt) return { ...previous, isOpen: true };
  const current = windowWeeksAgo(now, 0);
  return { ...current, isOpen: now >= current.opensAt };
}

/** The most recent window that has already closed. */
export function lastClosedWindow(now = new Date()) {
  const previous = windowWeeksAgo(now, 1);
  return now >= previous.closesAt ? previous : windowWeeksAgo(now, 2);
}

/** 0…1, how close the guess was to the actual amount. */
export function guessAccuracy(guess: number, actual: number) {
  if (actual <= 0) return guess <= 0 ? 1 : 0;
  return Math.max(0, 1 - Math.abs(actual - guess) / actual);
}

/** 0…1 accuracy of a saved check-in, or null when it was skipped. */
export function checkInAccuracy({ guess, actual }: Pick<CheckIn, 'guess' | 'actual'>) {
  if (guess === null) return null;
  return guessAccuracy(Number(guess), Number(actual ?? 0));
}

/** Accuracy of a saved check-in in percent, or null when it was skipped. */
export function accuracyPercent(checkIn: Pick<CheckIn, 'guess' | 'actual'>) {
  const accuracy = checkInAccuracy(checkIn);
  return accuracy === null ? null : Math.round(accuracy * 100);
}

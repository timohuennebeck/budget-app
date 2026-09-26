import { getCalendars } from 'expo-localization';
import i18n, { t } from 'i18next';

export interface DateRange {
  start: Date;
  /** Exclusive upper bound */
  end: Date;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** IANA time zone of the device, e.g. "Europe/Berlin". */
export function deviceTimeZone() {
  return getCalendars()[0]?.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function locale() {
  return i18n.language || 'en';
}

export function startOfDay(date: Date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export function isSameDay(a: Date, b: Date) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function daysBetween(from: Date, to: Date) {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

// Budget months can start on any day (profile "Monatsbeginn"); the cycle
// containing `date` runs from that day to the same day next month.
export function budgetCycle(date: Date, monthStartDay = 1): DateRange {
  const start = new Date(date.getFullYear(), date.getMonth(), monthStartDay);
  if (start > date) start.setMonth(start.getMonth() - 1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { start, end };
}

export function monthRange(date: Date): DateRange {
  return budgetCycle(date, 1);
}

/** Monday-to-Sunday week containing `date`. */
export function weekRange(date: Date): DateRange {
  const start = startOfDay(date);
  const weekday = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - weekday);
  return { start, end: addDays(start, 7) };
}

export function toISODate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromISODate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatTime(date: Date) {
  return new Intl.DateTimeFormat(locale(), { hour: '2-digit', minute: '2-digit' }).format(date);
}

/** "Do., 25. Sep." */
export function formatShortDate(date: Date) {
  return new Intl.DateTimeFormat(locale(), {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(date);
}

/** "24. September" */
export function formatLongDate(date: Date) {
  return new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'long' }).format(date);
}

/** "14. Sep. 1994" */
export function formatBirthDate(date: Date) {
  return new Intl.DateTimeFormat(locale(), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatWeekday(date: Date, width: 'long' | 'short' = 'long') {
  return new Intl.DateTimeFormat(locale(), { weekday: width }).format(date);
}

export function formatMonth(date: Date, withYear = false) {
  return new Intl.DateTimeFormat(locale(), {
    month: 'long',
    ...(withYear ? { year: 'numeric' } : {}),
  }).format(date);
}

export function monthNames(width: 'short' | 'long' = 'short') {
  const format = new Intl.DateTimeFormat(locale(), { month: width });
  return Array.from({ length: 12 }, (_, month) =>
    format.format(new Date(2000, month, 1)).replace('.', ''),
  );
}

/** "21.–27. Sep." */
export function formatWeekRange({ start, end }: DateRange) {
  const last = addDays(end, -1);
  const format = new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short' });
  if (typeof format.formatRange === 'function') return format.formatRange(start, last);
  return `${format.format(start)} – ${format.format(last)}`;
}

/** "Heute", "Gestern" or "24. September" */
export function formatDayLabel(date: Date, now = new Date()) {
  const diff = daysBetween(date, now);
  if (diff === 0) return t('common.today');
  if (diff === 1) return t('common.yesterday');
  return formatLongDate(date);
}

/** Two-letter weekday headers starting Monday: ["Mo", "Di", …] */
export function weekdayInitials() {
  const format = new Intl.DateTimeFormat(locale(), { weekday: 'short' });
  const monday = new Date(2024, 0, 1);
  return Array.from({ length: 7 }, (_, index) =>
    format.format(addDays(monday, index)).replace('.', '').slice(0, 2),
  );
}

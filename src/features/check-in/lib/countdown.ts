import { t } from 'i18next';

import { formatClock } from '@/shared/lib/dates';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

/** "2 T 4 Std", "4 Std 12 Min", then "12:05" in the last hour. */
export function formatCountdown(ms: number) {
  const left = Math.max(0, ms);
  const days = Math.floor(left / DAY);
  const hours = Math.floor((left % DAY) / HOUR);
  const minutes = Math.floor((left % HOUR) / MINUTE);
  if (days > 0) return t('checkIn.countdownDays', { days, hours });
  if (hours > 0) return t('checkIn.countdownHours', { hours, minutes });
  return formatClock(Math.floor(left / 1000));
}

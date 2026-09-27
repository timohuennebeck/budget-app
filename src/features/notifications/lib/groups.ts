import type { NotificationKind, NotificationSetting } from '../data/notifications-api';

// The switches in Profil › Erinnerung; each one turns several kinds on or off.
export const notificationGroups = {
  dailyReminder: ['daily_reminder'],
  checkIn: ['check_in_open', 'check_in_closing'],
  budgetWarnings: ['budget_warning', 'budget_exceeded', 'limit_almost_reached'],
} as const satisfies Record<string, NotificationKind[]>;

export type NotificationGroup = keyof typeof notificationGroups;

export function isGroupEnabled(settings: NotificationSetting[], group: NotificationGroup) {
  const kinds: readonly NotificationKind[] = notificationGroups[group];
  return settings.some((row) => kinds.includes(row.kind) && row.enabled);
}

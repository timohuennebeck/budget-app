import * as Notifications from 'expo-notifications';
import { t } from 'i18next';
import { Platform } from 'react-native';

import type { Enums } from '@/shared/lib/database.types';

export async function requestNotificationPermission() {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

// Replaces any existing reminder with one per day, or one per weekday
// (Mo–Fr) when `repeat` is "weekdays". Weekday 1 is Sunday in expo.
export async function scheduleReminder(time: string, repeat: Enums<'reminder_repeat'>) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  const [hour, minute] = time.split(':').map(Number);
  const content = {
    title: t('reminders.notificationTitle'),
    body: t('reminders.notificationBody'),
  };

  if (repeat === 'daily') {
    await Notifications.scheduleNotificationAsync({
      content,
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
    });
    return;
  }

  await Promise.all(
    [2, 3, 4, 5, 6].map((weekday) =>
      Notifications.scheduleNotificationAsync({
        content,
        trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday, hour, minute },
      }),
    ),
  );
}

export async function cancelReminders() {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

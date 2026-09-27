import * as Notifications from 'expo-notifications';
import { type Href, router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { markNotificationOpened } from '../data/notifications-api';
import { registerDevice } from '../lib/push';

function open(response: Notifications.NotificationResponse) {
  const data = response.notification.request.content.data as {
    url?: string;
    notification_id?: string;
  };
  if (data.notification_id) markNotificationOpened(data.notification_id).catch(() => {});
  if (data.url) router.push(data.url as Href);
}

/**
 * Signed in: links this device's push token to the account and follows the
 * deep link of a tapped notification (also the one that opened the app).
 */
export function usePushNotifications(userId: string) {
  useEffect(() => {
    if (!userId || Platform.OS === 'web') return;
    registerDevice();

    const last = Notifications.getLastNotificationResponse();
    if (last) {
      open(last);
      Notifications.clearLastNotificationResponse();
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(open);
    return () => subscription.remove();
  }, [userId]);
}

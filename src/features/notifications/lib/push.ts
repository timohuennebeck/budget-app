import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { storage } from '@/shared/lib/storage';

const TOKEN_KEY = 'push-token';

// Pushes that arrive while the app is open still show as a banner.
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

export async function requestNotificationPermission() {
  if (Platform.OS === 'web') return false;
  // Android 13+ only shows the permission prompt once a channel exists.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Looop',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function hasNotificationPermission() {
  if (Platform.OS === 'web') return false;
  return (await Notifications.getPermissionsAsync()).granted;
}

/**
 * This device's Expo push token, or null on web, simulators and builds
 * without an EAS project id (run `npx eas-cli init` once to add it).
 */
export async function getPushToken() {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (Platform.OS === 'web' || !Device.isDevice || !projectId) return null;
  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}

/** The token last registered from this device, so sign-out can remove it. */
export const savedPushToken = {
  get: () => storage.getString(TOKEN_KEY) ?? null,
  set: (token: string) => storage.set(TOKEN_KEY, token),
  clear: () => {
    storage.remove(TOKEN_KEY);
  },
};

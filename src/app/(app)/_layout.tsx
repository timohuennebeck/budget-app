import { Stack } from 'expo-router';

import { useUserId } from '@/features/auth/lib/auth-provider';
import { usePushNotifications } from '@/features/notifications/hooks/use-push-notifications';
import { useSyncTimeZone } from '@/features/profile/hooks/use-profile';

export const unstable_settings = { anchor: '(tabs)' };

const fromBottom = { animation: 'slide_from_bottom' } as const;

export default function AppLayout() {
  useSyncTimeZone();
  usePushNotifications(useUserId());
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="capture" options={fromBottom} />
      <Stack.Screen name="check-in" options={fromBottom} />
      <Stack.Screen name="paywall" options={fromBottom} />
      <Stack.Screen name="limit" options={fromBottom} />
      <Stack.Screen name="rating" options={fromBottom} />
    </Stack>
  );
}

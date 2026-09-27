import { Stack } from 'expo-router';

import { useUserId } from '@/features/auth/lib/auth-provider';
import { usePushNotifications } from '@/features/notifications/hooks/use-push-notifications';
import { useSyncTimeZone } from '@/features/profile/hooks/use-profile';
import { useWalletInbox } from '@/features/wallet/hooks/use-wallet-inbox';

export const unstable_settings = { anchor: '(tabs)' };

const fromBottom = { animation: 'slide_from_bottom' } as const;

export default function AppLayout() {
  useSyncTimeZone();
  usePushNotifications(useUserId());
  useWalletInbox();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      {/* Eintrag, Foto and Sprache on Start open instantly, without sliding in. */}
      <Stack.Screen name="capture" options={{ animation: 'none' }} />
      <Stack.Screen name="check-in" options={fromBottom} />
      <Stack.Screen name="paywall" options={fromBottom} />
      <Stack.Screen name="limit" options={fromBottom} />
      <Stack.Screen name="rating" options={fromBottom} />
    </Stack>
  );
}

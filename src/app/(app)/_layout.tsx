import { Stack } from 'expo-router';

import { useUserId } from '@/features/auth/lib/auth-provider';
import { usePushNotifications } from '@/features/notifications/hooks/use-push-notifications';
import { useSyncTimeZone } from '@/features/profile/hooks/use-profile';
import { useWalletInbox } from '@/features/wallet/hooks/use-wallet-inbox';

export const unstable_settings = { anchor: '(tabs)' };

const fromBottom = { animation: 'slide_from_bottom' } as const;
// Full-screen modals look like the slide from the bottom, but also appear
// above the capture modal: screens pushed below a native modal stay hidden.
const overModal = { presentation: 'fullScreenModal', animation: 'slide_from_bottom' } as const;

export default function AppLayout() {
  useSyncTimeZone();
  usePushNotifications(useUserId());
  useWalletInbox();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      {/* Eintrag, Foto, Sprache and Einnahme slide up full screen. */}
      <Stack.Screen name="capture" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="check-in" options={fromBottom} />
      <Stack.Screen name="paywall" options={overModal} />
      <Stack.Screen name="limit" options={overModal} />
      <Stack.Screen name="rating" options={overModal} />
    </Stack>
  );
}

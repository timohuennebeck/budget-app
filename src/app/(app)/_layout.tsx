import { Stack } from 'expo-router';

import { useSyncTimeZone } from '@/features/profile/hooks/use-profile';

export const unstable_settings = { anchor: '(tabs)' };

const fromBottom = { animation: 'slide_from_bottom' } as const;

export default function AppLayout() {
  useSyncTimeZone();
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

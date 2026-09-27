import '@/global.css';
import '@/shared/i18n';

import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/features/auth/lib/auth-provider';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { useSyncLanguage } from '@/features/profile/hooks/use-sync-language';
import { queryClient } from '@/shared/lib/query-client';
import { preloadSounds } from '@/shared/lib/sounds';

SplashScreen.preventAutoHideAsync();

function RootNavigator({ fontsLoaded }: { fontsLoaded: boolean }) {
  const { session, isLoading } = useAuth();
  const profile = useProfile();
  useSyncLanguage(profile.data?.locale);

  // Onboarding stays reachable after sign-up (paywall, done) until the
  // profile is marked as onboarded; only then the app becomes available.
  const isOnboarded = !!session && !!profile.data?.onboarded_at;
  const ready = fontsLoaded && !isLoading && (!session || !profile.isPending);
  // Only the first render waits for the profile. Signing in or up later
  // must not unmount the navigator (and the screen awaiting the sign-up).
  const [booted, setBooted] = useState(false);
  if (ready && !booted) setBooted(true);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!booted && !ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!isOnboarded}>
        <Stack.Screen name="(onboarding)" />
      </Stack.Protected>
      <Stack.Protected guard={isOnboarded}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Screen name="legal/[kind]" />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(preloadSounds, []);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BottomSheetModalProvider>
              <StatusBar style="dark" />
              <RootNavigator fontsLoaded={fontsLoaded} />
            </BottomSheetModalProvider>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

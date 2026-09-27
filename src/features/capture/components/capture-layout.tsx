import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useCaptureStore } from '../data/capture-store';

// Stack for the capture flow (/capture and /first-entry). Closing it clears
// the session, since camera and voice open directly (skipping the text
// screen's `start`), so old drafts or "Weitere hinzufügen" can't leak.
// As a native full-screen modal it needs its own gesture root, safe area and
// sheet host; sheets hosted at the root would open behind it.
export function CaptureLayout() {
  useEffect(() => {
    useCaptureStore.setState({ open: true });
    return () => {
      useCaptureStore.getState().start();
      useCaptureStore.setState({ open: false });
    };
  }, []);
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </BottomSheetModalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

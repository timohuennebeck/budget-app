import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { useCaptureStore } from '../data/capture-store';

// Stack for the capture flow (/capture and /first-entry). Clears the session
// when the flow closes: camera and voice can be opened directly (skipping the
// text screen that calls `start`), so leftover drafts or a pending "Weitere
// hinzufügen" must not leak into the next one.
// In the app the flow is a modal sheet, which needs its own gesture root,
// safe area (no status bar inset inside the sheet) and sheet host, since
// bottom sheets hosted at the root would open behind the modal.
export function CaptureLayout() {
  useEffect(() => () => useCaptureStore.getState().start(), []);
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

import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useCaptureStore } from '../data/capture-store';

// Stack for the capture flow (/capture and /first-entry). Clears the session
// when the flow closes: camera and voice can be opened directly (skipping the
// text screen that calls `start`), so leftover drafts or a pending "Weitere
// hinzufügen" must not leak into the next one.
export function CaptureLayout() {
  useEffect(() => () => useCaptureStore.getState().start(), []);
  return <Stack screenOptions={{ headerShown: false }} />;
}

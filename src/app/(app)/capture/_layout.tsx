import { Stack } from 'expo-router';

import { useResetCaptureOnClose } from '@/features/capture/data/capture-store';

export default function CaptureLayout() {
  useResetCaptureOnClose();
  return <Stack screenOptions={{ headerShown: false }} />;
}

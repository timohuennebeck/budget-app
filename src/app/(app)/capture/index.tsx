import { router, useLocalSearchParams } from 'expo-router';

import { CaptureTextScreen } from '@/features/capture/components/capture-text-screen';

export default function CaptureRoute() {
  const { text } = useLocalSearchParams<{ text?: string }>();
  return <CaptureTextScreen mode="app" initialText={text} onClose={() => router.back()} />;
}

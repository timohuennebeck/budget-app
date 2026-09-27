import { router } from 'expo-router';

import { CaptureTextScreen } from '@/features/capture/components/capture-text-screen';

export default function FirstEntry() {
  return <CaptureTextScreen mode="onboarding" onClose={() => router.push('/budget-type')} />;
}

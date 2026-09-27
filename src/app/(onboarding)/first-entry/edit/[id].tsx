import { useLocalSearchParams } from 'expo-router';

import { DraftEditScreen } from '@/features/capture/components/draft-edit-screen';

export default function FirstEntryEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <DraftEditScreen id={id} mode="onboarding" />;
}

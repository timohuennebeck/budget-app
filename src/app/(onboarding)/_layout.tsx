import { Stack } from 'expo-router';

import { ClickSoundsContext } from '@/shared/lib/click-sounds';

export default function OnboardingLayout() {
  return (
    <ClickSoundsContext.Provider value={true}>
      <Stack screenOptions={{ headerShown: false }} />
    </ClickSoundsContext.Provider>
  );
}

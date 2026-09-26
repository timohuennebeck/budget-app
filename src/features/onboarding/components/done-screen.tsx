import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useUserId } from '@/features/auth/lib/auth-provider';
import { useUpdateProfile } from '@/features/profile/hooks/use-profile';
import { Screen } from '@/shared/components/screen';
import { haptics } from '@/shared/lib/haptics';
import { Button } from '@/shared/ui/button';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

import { useOnboardingStore } from '../data/onboarding-store';
import { usePendingIntent } from '../data/pending-intent';
import { completeOnboarding } from '../lib/complete-onboarding';

// Last step (2n). Marking the profile as onboarded flips the protected
// routes to the app (the router redirects on its own); a pending intent
// opens the capture flow once the overview mounts.
export function DoneScreen() {
  const { t } = useTranslation();
  const firstName = useOnboardingStore((state) => state.firstName);
  const reset = useOnboardingStore((state) => state.reset);
  const setIntent = usePendingIntent((state) => state.set);
  const updateProfile = useUpdateProfile();
  const userId = useUserId();
  const [saving, setSaving] = useState(false);

  // The guard switch unmounts this screen, so await instead of callbacks.
  const finish = async (intent: 'capture' | null) => {
    if (saving) return;
    setSaving(true);
    setIntent(intent);
    haptics.success();
    try {
      // Sign-up normally saved the answers already. Not when the address had
      // to be confirmed first (sign-in lands here) or the app was closed after
      // a failed save; completeOnboarding is safe to re-run.
      const draft = useOnboardingStore.getState();
      if (!draft.saved && draft.firstName) await completeOnboarding(userId, draft);
      await updateProfile.mutateAsync({ onboarded_at: new Date().toISOString() });
      reset();
    } catch {
      // Stay here so the user can retry; don't open capture on a later visit.
      setIntent(null);
      setSaving(false);
      haptics.error();
    }
  };

  return (
    <Screen
      gradient="mist"
      footer={
        <View>
          <Button
            label={t('onboarding.done.firstEntry')}
            loading={saving}
            onPress={() => finish('capture')}
          />
          <Button
            variant="ghost"
            className="mt-1"
            label={t('onboarding.done.overview')}
            onPress={() => finish(null)}
          />
        </View>
      }>
      <View className="flex-1 items-center justify-center">
        <Pip pose="success" size={240} />
      </View>
      <View className="gap-2.5 px-1">
        <Text variant="display" leading={1.15}>
          {t('onboarding.done.titleStart')}
          <Text variant="display" className="text-primary-dark">
            {` ${firstName} `}
          </Text>
          {t('onboarding.done.titleEnd')}
        </Text>
        <Text variant="body" weight="medium" className="text-muted">
          {t('onboarding.done.subtitle')}
        </Text>
      </View>
    </Screen>
  );
}

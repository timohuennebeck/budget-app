import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { requestNotificationPermission } from '@/features/reminders/lib/reminders';
import { GradientPanel } from '@/shared/components/gradient-panel';
import { Screen } from '@/shared/components/screen';
import { Button } from '@/shared/ui/button';
import { Pip } from '@/shared/ui/pip';

import { useOnboardingStore } from '../data/onboarding-store';
import { ONBOARDING_STEPS } from '../lib/steps';
import { NotificationPreview } from './notification-preview';
import { OnboardingHeader } from './onboarding-header';
import { StepIntro } from './step-intro';

export function NotificationsScreen() {
  const { t } = useTranslation();
  const update = useOnboardingStore((state) => state.update);
  const [asking, setAsking] = useState(false);

  const allow = async () => {
    setAsking(true);
    const granted = await requestNotificationPermission();
    setAsking(false);
    update({ reminderEnabled: granted });
    router.push(granted ? '/reminder-time' : '/action-button');
  };

  return (
    <Screen
      footer={
        <View>
          <Button label={t('onboarding.notifications.allow')} loading={asking} onPress={allow} />
          <Button
            variant="ghost"
            className="mt-1"
            label={t('common.later')}
            onPress={() => router.push('/action-button')}
          />
        </View>
      }>
      <OnboardingHeader step={ONBOARDING_STEPS.notifications} />
      <StepIntro
        title={t('onboarding.notifications.title')}
        subtitle={t('onboarding.notifications.subtitle')}
      />
      <GradientPanel style={{ padding: 16, paddingBottom: 20, gap: 10 }}>
        <NotificationPreview />
        <View className="mt-1.5 items-center">
          <Pip pose="cheers-arms" size={150} />
        </View>
      </GradientPanel>
    </Screen>
  );
}

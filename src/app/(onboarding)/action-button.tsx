import { router } from 'expo-router';
import { Platform } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ActionButtonScreen } from '@/features/onboarding/components/action-button-screen';
import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/steps';

export default function OnboardingActionButton() {
  const { t } = useTranslation();
  return (
    <ActionButtonScreen
      header={<OnboardingHeader step={ONBOARDING_STEPS.actionButton} />}
      laterLabel={t('common.later')}
      // Apple Pay only exists on iPhone.
      onDone={() => router.push(Platform.OS === 'android' ? '/widget' : '/apple-pay')}
    />
  );
}

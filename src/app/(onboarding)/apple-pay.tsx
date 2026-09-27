import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/steps';
import { WalletSetupScreen } from '@/features/wallet/components/wallet-setup-screen';

// Payments noted before sign-up wait in the inbox and show up for review
// right after the account exists.
export default function OnboardingApplePay() {
  const { t } = useTranslation();
  return (
    <WalletSetupScreen
      header={<OnboardingHeader step={ONBOARDING_STEPS.applePay} />}
      laterLabel={t('common.later')}
      onDone={() => router.push('/widget')}
    />
  );
}

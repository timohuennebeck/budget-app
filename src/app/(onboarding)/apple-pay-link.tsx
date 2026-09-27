import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/steps';
import { WalletLinkScreen } from '@/features/wallet/components/wallet-link-screen';

export default function OnboardingApplePayLink() {
  const { t } = useTranslation();
  return (
    <WalletLinkScreen
      header={<OnboardingHeader step={ONBOARDING_STEPS.applePay} />}
      laterLabel={t('common.later')}
      onDone={() => router.push('/widget')}
    />
  );
}

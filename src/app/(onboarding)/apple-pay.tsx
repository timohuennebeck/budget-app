import { router } from 'expo-router';

import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/steps';
import { WalletIntroScreen } from '@/features/wallet/components/wallet-intro-screen';

export default function OnboardingApplePay() {
  return (
    <WalletIntroScreen
      header={<OnboardingHeader step={ONBOARDING_STEPS.applePay} />}
      onSetUp={() => router.push('/apple-pay-setup')}
      onLater={() => router.push('/widget')}
    />
  );
}

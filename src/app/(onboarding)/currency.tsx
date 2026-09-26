import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/steps';
import { CurrencyScreen } from '@/features/profile/components/currency-screen';

export default function OnboardingCurrency() {
  const { t } = useTranslation();
  const currency = useOnboardingStore((state) => state.currency);
  const update = useOnboardingStore((state) => state.update);

  return (
    <CurrencyScreen
      header={<OnboardingHeader step={ONBOARDING_STEPS.currency} />}
      initial={currency}
      submitLabel={(name) => t('currency.continueWith', { name })}
      onSubmit={(next) => {
        update({ currency: next });
        router.push('/first-entry');
      }}
    />
  );
}

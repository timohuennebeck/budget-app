import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { MonthlyBudgetScreen } from '@/features/budgets/components/monthly-budget-screen';
import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/steps';

export default function OnboardingMonthlyBudget() {
  const { t } = useTranslation();
  const monthlyBudget = useOnboardingStore((state) => state.monthlyBudget);
  const currency = useOnboardingStore((state) => state.currency);
  const update = useOnboardingStore((state) => state.update);

  return (
    <MonthlyBudgetScreen
      header={<OnboardingHeader step={ONBOARDING_STEPS.budget} />}
      initial={monthlyBudget}
      currency={currency}
      submitLabel={t('common.continue')}
      onSubmit={(amount) => {
        update({ monthlyBudget: amount, budgetMode: 'monthly' });
        router.push('/notifications');
      }}
    />
  );
}

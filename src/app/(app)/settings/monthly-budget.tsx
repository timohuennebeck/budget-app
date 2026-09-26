import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { MonthlyBudgetScreen } from '@/features/budgets/components/monthly-budget-screen';
import { useProfile, useUpdateProfile } from '@/features/profile/hooks/use-profile';
import { ScreenHeader } from '@/shared/components/screen-header';

export default function MonthlyBudgetSettings() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  if (!profile) return null;

  return (
    <MonthlyBudgetScreen
      header={<ScreenHeader title={t('profile.monthlyBudget')} />}
      initial={Number(profile.monthly_budget ?? 1000)}
      currency={profile.currency}
      submitLabel={t('common.save')}
      onSubmit={(amount) => {
        update.mutate({
          monthly_budget: amount,
          budget_mode: profile.budget_mode === 'none' ? 'monthly' : profile.budget_mode,
        });
        router.back();
      }}
    />
  );
}

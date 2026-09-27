import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CategoryBudgetsScreen } from '@/features/budgets/components/category-budgets-screen';
import { usePresetDisplays } from '@/features/categories/hooks/use-category-display';
import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/steps';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';

export default function OnboardingCategoryBudgets() {
  const { t } = useTranslation();
  const categories = usePresetDisplays();
  const limits = useOnboardingStore((state) => state.categoryLimits);
  const currency = useOnboardingStore((state) => state.currency);
  const update = useOnboardingStore((state) => state.update);

  const items = categories.map((category) => {
    const peer = category.peerAverage ?? 100;
    return {
      category,
      limit: limits[category.id] ?? null,
      reference: peer,
      hint: t('budgets.peerAverage', { amount: formatMoney(peer, { currency, compact: true }) }),
    };
  });

  return (
    <CategoryBudgetsScreen
      header={<OnboardingHeader step={ONBOARDING_STEPS.budget} />}
      items={items}
      currency={currency}
      onSetLimit={(id, limit) =>
        update({ categoryLimits: { ...limits, [id]: limit }, budgetMode: 'per_category' })
      }
      footer={<Button label={t('common.continue')} onPress={() => router.push('/notifications')} />}
    />
  );
}

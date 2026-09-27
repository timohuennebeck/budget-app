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
  const entries = useOnboardingStore((state) => state.entries);

  // Up front: where the first entries landed, the most common categories
  // and any limit already set; everything else behind "show all".
  const used = new Set(entries.map((entry) => entry.categoryId));
  const items = categories
    .map((category) => {
      const peer = category.peerAverage ?? 100;
      return {
        category,
        limit: limits[category.id] ?? null,
        reference: peer,
        hint: t('budgets.peerAverage', { amount: formatMoney(peer, { currency, compact: true }) }),
        featured: used.has(category.id) || category.suggested || limits[category.id] != null,
      };
    })
    .sort((a, b) => Number(used.has(b.category.id)) - Number(used.has(a.category.id)));

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

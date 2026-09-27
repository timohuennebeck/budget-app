import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CategoryBudgetsScreen } from '@/features/budgets/components/category-budgets-screen';
import {
  type CategoryDisplay,
  usePresetDisplays,
} from '@/features/categories/hooks/use-category-display';
import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/steps';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';

const FEATURED = 4;

export default function OnboardingCategoryBudgets() {
  const { t } = useTranslation();
  const categories = usePresetDisplays();
  const limits = useOnboardingStore((state) => state.categoryLimits);
  const currency = useOnboardingStore((state) => state.currency);
  const update = useOnboardingStore((state) => state.update);
  const entries = useOnboardingStore((state) => state.entries);

  // Four up front: where the first entries landed, then the most common
  // categories (plus any limit already set); the rest behind "show more".
  const used = new Set(entries.map((entry) => entry.categoryId));
  const rank = (category: CategoryDisplay) =>
    used.has(category.id) ? 0 : category.suggested ? 1 : 2;
  const items = categories
    .filter((category) => category.kind === 'expense')
    .sort((a, b) => rank(a) - rank(b))
    .map((category, index) => {
      const peer = category.peerAverage ?? 100;
      const limit = limits[category.id] ?? null;
      return {
        category,
        limit,
        reference: peer,
        hint: t('budgets.peerAverage', { amount: formatMoney(peer, { currency, compact: true }) }),
        featured: index < FEATURED || limit !== null,
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

import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryBudgetsScreen } from '@/features/budgets/components/category-budgets-screen';
import { useAppCategoryDisplays } from '@/features/categories/hooks/use-category-display';
import {
  useCategoryLimits,
  useSetCategoryLimit,
} from '@/features/categories/hooks/use-category-limits';
import { useRecentEntries } from '@/features/entries/hooks/use-entries';
import { spendByCategory } from '@/features/entries/lib/entry-stats';
import { useCurrency, useProfile, useUpdateProfile } from '@/features/profile/hooks/use-profile';
import { ScreenHeader } from '@/shared/components/screen-header';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';

export default function BudgetSettings() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const { data: limits } = useCategoryLimits();
  const displays = useAppCategoryDisplays();
  const { data: recent = [] } = useRecentEntries();
  const setLimit = useSetCategoryLimit();
  const updateProfile = useUpdateProfile();
  const currency = useCurrency();

  const items = useMemo(() => {
    const totals = spendByCategory(recent);
    return displays.map((category) => {
      const spent = totals.get(category.id) ?? 0;
      return {
        category,
        limit: limits?.get(category.id) ?? null,
        reference: spent || 100,
        hint: t('budgets.last30Days', { amount: formatMoney(spent, { currency, compact: true }) }),
      };
    });
  }, [displays, limits, recent, currency, t]);

  return (
    <CategoryBudgetsScreen
      header={<ScreenHeader title={t('profile.categories')} />}
      items={items}
      currency={currency}
      onSetLimit={(id, limit) => {
        setLimit.mutate({ id, limit });
        if (limit !== null && profile?.budget_mode === 'none')
          updateProfile.mutate({ budget_mode: 'per_category' });
      }}
      footer={
        <View>
          <Button label={t('common.done')} onPress={() => router.back()} />
          <Button
            variant="ghost"
            className="mt-2.5"
            label={t('categories.create')}
            onPress={() => router.push('/categories/new')}
          />
        </View>
      }
    />
  );
}

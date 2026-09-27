import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudgetCarousel } from '@/features/budgets/components/budget-carousel';
import { BudgetSheet } from '@/features/budgets/components/budget-sheet';
import { SpendBar } from '@/features/budgets/components/spend-bar';
import { summarizeBudget } from '@/features/budgets/lib/budget-summary';
import { useAppCategoryDisplays } from '@/features/categories/hooks/use-category-display';
import {
  useCategoryLimits,
  useSetCategoryLimit,
} from '@/features/categories/hooks/use-category-limits';
import { useCategoryLookup } from '@/features/categories/hooks/use-category-lookup';
import { useEntries, useRecentEntries } from '@/features/entries/hooks/use-entries';
import { spendByCategory } from '@/features/entries/lib/entry-stats';
import { usePendingIntent } from '@/features/onboarding/data/pending-intent';
import { useCurrency, useProfile } from '@/features/profile/hooks/use-profile';
import { GradientBackground } from '@/shared/components/gradient-background';
import { SectionHeader } from '@/shared/components/section-header';
import { useSheet } from '@/shared/components/sheet';
import { budgetCycle, formatMonth } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { tabScrollProps } from '@/shared/lib/tab-insets';
import { shadows } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { IconButton } from '@/shared/ui/icon-button';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { BalanceHero } from './balance-hero';
import { CaptureActions } from './capture-actions';
import { RecentEntries } from './recent-entries';
import { EmptyEntriesCard } from './empty-entries-card';

const NO_LIMITS = new Map<string, number>();

// Übersicht (2l-i / 3a): what's left this month with Pip, spend per
// category, capture actions, the latest entries and budget cards with a
// limit sheet (2w).
export function OverviewScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scroll = tabScrollProps(insets.top, 4);
  const { data: profile } = useProfile();
  const categories = useAppCategoryDisplays();
  const { data: limits = NO_LIMITS } = useCategoryLimits();
  const lookup = useCategoryLookup();
  const cycle = budgetCycle(new Date(), profile?.month_start_day ?? 1);
  const { data: entries = [] } = useEntries(cycle);
  const { data: recent = [] } = useRecentEntries();
  const setLimit = useSetCategoryLimit();
  const sheet = useSheet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const consumeIntent = usePendingIntent((state) => state.consume);

  useFocusEffect(
    useCallback(() => {
      if (consumeIntent() === 'capture') router.push('/capture');
    }, [consumeIntent]),
  );

  const currency = useCurrency();
  const summary = useMemo(
    () =>
      profile
        ? summarizeBudget(
            profile,
            categories.filter((category) => category.kind === 'expense'),
            limits,
            entries,
          )
        : null,
    [profile, categories, limits, entries],
  );
  const recentTotals = useMemo(() => spendByCategory(recent), [recent]);
  const editing = categories.find((category) => category.id === editingId);
  const money = (value: number) => formatMoney(value, { currency, compact: true });

  if (!profile || !summary) return null;

  return (
    <View className="flex-1 bg-canvas">
      <GradientBackground name="sky" />
      <ScrollView
        contentInsetAdjustmentBehavior={scroll.contentInsetAdjustmentBehavior}
        contentContainerStyle={{
          paddingTop: scroll.paddingTop,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between px-1">
          <Pressable
            onPress={() => router.navigate({ pathname: '/entries', params: { search: '1' } })}
            accessibilityLabel={t('common.search')}
            className="h-10 flex-row items-center gap-[7px] rounded-full bg-surface pr-4 pl-[13px]"
            style={shadows.card}>
            <Icon name="magnifying-glass" size={18} />
            <Text size={15} weight="semibold" tracking={-0.01}>
              {t('common.search')}
            </Text>
          </Pressable>
          <IconButton
            icon="gear-six"
            variant="surface"
            size={40}
            iconSize={18}
            accessibilityLabel={t('tabs.profile')}
            onPress={() => router.navigate('/profile')}
          />
        </View>

        <BalanceHero
          label={
            summary.total === null
              ? t('overview.spentThisMonth')
              : t('overview.leftIn', { month: formatMonth(new Date()) })
          }
          amount={summary.total === null ? summary.spent : (summary.free ?? 0)}
          currency={currency}
          over={summary.free !== null && summary.free < 0}
        />
        <SpendBar
          segments={summary.segments}
          spent={summary.spent}
          total={summary.total}
          currency={currency}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
        <CaptureActions />

        {recent.length ? (
          <>
            <SectionHeader
              className="mt-6 mb-2.5"
              title={t('overview.entries')}
              actionLabel={t('overview.showAll')}
              onAction={() => router.navigate('/entries')}
            />
            <RecentEntries entries={recent} categories={lookup} currency={currency} />
          </>
        ) : (
          <EmptyEntriesCard />
        )}
        {summary.cards.length ? (
          <>
            <SectionHeader
              className="mt-[26px] mb-2.5"
              title={t('overview.budgets')}
              actionLabel={t('common.edit')}
              onAction={() => router.push('/settings/budgets')}
            />
            <BudgetCarousel
              cards={summary.cards}
              currency={currency}
              onEdit={(id) => {
                setEditingId(id);
                sheet.present();
              }}
            />
          </>
        ) : null}
      </ScrollView>

      <BudgetSheet
        open={sheet.controls.open}
        onClose={() => {
          sheet.dismiss();
          setEditingId(null);
        }}
        title={editing?.name ?? ''}
        currency={currency}
        initial={editing ? (limits.get(editing.id) ?? null) : null}
        reference={editing ? (recentTotals.get(editing.id) ?? 100) : 100}
        hint={t('budgets.last30Days', {
          amount: money(editing ? (recentTotals.get(editing.id) ?? 0) : 0),
        })}
        onSave={(limit) => {
          if (editing) setLimit.mutate({ id: editing.id, limit });
          sheet.dismiss();
        }}
      />
    </View>
  );
}

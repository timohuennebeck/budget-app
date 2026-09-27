import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

import { type BalancePage, BalancePager } from './balance-pager';
import { CaptureActions } from './capture-actions';
import { RecentEntries } from './recent-entries';
import { EmptyEntriesCard } from './empty-entries-card';

const NO_LIMITS = new Map<string, number>();

// Übersicht (2l / 3a): what's left this month and per budget as swipeable
// pages (limit sheet on tap, 2w), capture actions, spend per category and
// the latest entries.
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
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const consumeIntent = usePendingIntent((state) => state.consume);

  useFocusEffect(
    useCallback(() => {
      if (consumeIntent() === 'capture') router.push('/capture');
    }, [consumeIntent]),
  );

  const currency = useCurrency();
  const summary = useMemo(
    () => (profile ? summarizeBudget(profile, categories, limits, entries) : null),
    [profile, categories, limits, entries],
  );
  const recentTotals = useMemo(() => spendByCategory(recent), [recent]);
  const editing = categories.find((category) => category.id === editingId);
  const money = (value: number) => formatMoney(value, { currency, compact: true });

  if (!profile || !summary) return null;

  // Page 1: the whole month; then one page per category with a limit.
  const pages: BalancePage[] = [
    {
      key: 'month',
      label:
        summary.total === null
          ? t('overview.spentThisMonth')
          : t('overview.leftIn', { month: formatMonth(new Date()) }),
      amount: summary.total === null ? summary.spent : (summary.free ?? 0),
      danger: summary.free !== null && summary.free < 0,
    },
    ...summary.cards.map((card) => ({
      key: card.category.id,
      label: t(card.remaining < 0 ? 'overview.categoryOver' : 'overview.categoryLeft', {
        name: card.category.name,
      }),
      amount: card.remaining,
      detail: t('overview.of', { amount: money(card.limit) }),
      danger: card.remaining < 0,
      categoryId: card.category.id,
    })),
  ];
  const pageOf = (categoryId: string | null) =>
    Math.max(
      0,
      pages.findIndex((item) => item.categoryId === categoryId),
    );

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

        <BalancePager
          pages={pages}
          currency={currency}
          page={Math.min(page, pages.length - 1)}
          onPageChange={(next) => {
            setPage(next);
            setSelectedId(pages[next]?.categoryId ?? null);
          }}
          onPressCategory={(id) => {
            setEditingId(id);
            sheet.present();
          }}
        />
        <CaptureActions />
        <SpendBar
          segments={summary.segments}
          spent={summary.spent}
          total={summary.total}
          currency={currency}
          selectedId={selectedId}
          // A category with its own page swipes there; others stay on the month.
          onSelect={(id) => {
            setSelectedId(id);
            setPage(pageOf(id));
          }}
        />

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

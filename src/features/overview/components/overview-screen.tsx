import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BudgetCarousel } from '@/features/budgets/components/budget-carousel';
import { BudgetSheet } from '@/features/budgets/components/budget-sheet';
import { AvailableHero } from '@/features/budgets/components/available-hero';
import { SpendBar } from '@/features/budgets/components/spend-bar';
import { summarizeBudget } from '@/features/budgets/lib/budget-summary';
import { CheckInCard } from '@/features/check-in/components/check-in-card';
import type { Category } from '@/features/categories/data/categories-api';
import { useCategories, useSetCategoryLimit } from '@/features/categories/hooks/use-categories';
import { useCategoryLookup } from '@/features/categories/hooks/use-category-lookup';
import { EntryList } from '@/features/entries/components/entry-list';
import { useEntries, useRecentEntries } from '@/features/entries/hooks/use-entries';
import { groupByDay, spendByCategory } from '@/features/entries/lib/entry-stats';
import { usePendingIntent } from '@/features/onboarding/data/pending-intent';
import { useCurrency, useProfile } from '@/features/profile/hooks/use-profile';
import { GradientBackground } from '@/shared/components/gradient-background';
import { SectionHeader } from '@/shared/components/section-header';
import { useSheet } from '@/shared/components/sheet';
import { budgetCycle, formatMonth } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { shadows } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { IconButton } from '@/shared/ui/icon-button';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { CaptureDock } from './capture-dock';
import { EmptyEntriesCard } from './empty-entries-card';

const RECENT_DAYS = 2;

// Übersicht (2l / 3a): what's left this month, spend per category, budget
// cards with an edit sheet (2w), recent entries and the capture dock.
export function OverviewScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const { data: categories = [] } = useCategories();
  const lookup = useCategoryLookup();
  const cycle = budgetCycle(new Date(), profile?.month_start_day ?? 1);
  const { data: entries = [] } = useEntries(cycle);
  const { data: recent = [] } = useRecentEntries();
  const setLimit = useSetCategoryLimit();
  const sheet = useSheet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const consumeIntent = usePendingIntent((state) => state.consume);

  useFocusEffect(
    useCallback(() => {
      if (consumeIntent() === 'capture') router.push('/capture');
    }, [consumeIntent]),
  );

  const currency = useCurrency();
  const summary = useMemo(
    () => (profile ? summarizeBudget(profile, categories, entries) : null),
    [profile, categories, entries],
  );
  const groups = useMemo(() => groupByDay(entries).slice(0, RECENT_DAYS), [entries]);
  const recentTotals = useMemo(() => spendByCategory(recent), [recent]);
  const editing = categories.find((category) => category.id === editingId);
  const nameOf = (category: Category) => lookup.get(category.id)?.name ?? category.name;
  const money = (value: number) => formatMoney(value, { currency, compact: true });

  if (!profile || !summary) return null;

  const hasEntries = entries.length > 0;
  const available = summary.free ?? -summary.spent;
  const pill = hasEntries
    ? {
        highlight: t('overview.averagePerDay', { amount: money(summary.averagePerDay) }),
        detail: t('overview.inMonth', { month: formatMonth(new Date()) }),
      }
    : {
        highlight: t('overview.perDay', { amount: money(summary.freePerDay ?? 0) }),
        detail: t('overview.daysLeft', { count: summary.daysLeft }),
      };

  return (
    <View className="flex-1 bg-canvas">
      <GradientBackground name="sky" />
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 4,
          paddingHorizontal: 16,
          paddingBottom: 120,
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

        <AvailableHero
          label={summary.total === null ? t('overview.spentThisMonth') : t('overview.available')}
          amount={summary.total === null ? summary.spent : available}
          currency={currency}
          highlight={pill.highlight}
          detail={pill.detail}
        />
        <SpendBar
          segments={summary.segments}
          spent={summary.spent}
          total={summary.total}
          currency={currency}
        />

        <CheckInCard />

        {summary.cards.length ? (
          <>
            <SectionHeader
              className="mt-6 mb-2.5"
              title={t('overview.budgets')}
              actionLabel={t('common.edit')}
              onAction={() => router.push('/settings/budgets')}
            />
            <BudgetCarousel
              cards={summary.cards}
              currency={currency}
              editingId={editingId}
              nameFor={(card) => nameOf(card.category)}
              onEdit={(id) => {
                setEditingId(id);
                sheet.present();
              }}
            />
          </>
        ) : null}

        {hasEntries ? (
          <>
            <SectionHeader
              className="mt-[26px] mb-2.5"
              title={t('overview.entries')}
              actionLabel={t('overview.showAll')}
              onAction={() => router.navigate('/entries')}
            />
            <EntryList groups={groups} categories={lookup} currency={currency} />
          </>
        ) : (
          <EmptyEntriesCard />
        )}
      </ScrollView>

      <CaptureDock firstName={profile.first_name} />

      <BudgetSheet
        open={sheet.controls.open}
        onClose={() => {
          sheet.dismiss();
          setEditingId(null);
        }}
        title={editing ? nameOf(editing) : ''}
        currency={currency}
        initial={editing?.monthly_limit ?? null}
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

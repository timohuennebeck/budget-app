import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppCategoryDisplays } from '@/features/categories/hooks/use-category-display';
import {
  useCategoryLimits,
  useSetCategoryLimit,
} from '@/features/categories/hooks/use-category-limits';
import { useEntries, useRecentEntries } from '@/features/entries/hooks/use-entries';
import { spendByCategory } from '@/features/entries/lib/entry-stats';
import { useCurrency, useProfile, useUpdateProfile } from '@/features/profile/hooks/use-profile';
import { GradientBackground } from '@/shared/components/gradient-background';
import { MonthSheet } from '@/shared/components/month-sheet';
import { useSheet } from '@/shared/components/sheet';
import { MonthPill, TabTitle, TabTopBar } from '@/shared/components/tab-header';
import { useToday } from '@/shared/hooks/use-today';
import { budgetCycle, formatMonthLabel, toISODate } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { tabListProps } from '@/shared/lib/tab-insets';
import { Card } from '@/shared/ui/card';
import { Text } from '@/shared/ui/text';

import { budgetList } from '../lib/budget-list';
import { summarizeBudget } from '../lib/budget-summary';
import { BudgetRow } from './budget-row';
import { BudgetSheet } from './budget-sheet';
import { SpendBar } from './spend-bar';

const NO_LIMITS = new Map<string, number>();

// Budgets tab: every expense category in a budget month, with what's spent
// against its limit. A row opens the category's chart; the pencil sets the
// limit. Categories without spending or a limit follow, greyed.
export function BudgetsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const layout = tabListProps(insets.top);
  const { data: profile } = useProfile();
  const currency = useCurrency();
  const categories = useAppCategoryDisplays();
  const { data: limits = NO_LIMITS } = useCategoryLimits();
  const setLimit = useSetCategoryLimit();
  const updateProfile = useUpdateProfile();
  const monthSheet = useSheet();
  const limitSheet = useSheet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Follows today until a month is picked; a budget month is named after the
  // month it starts in.
  const startDay = profile?.month_start_day ?? 1;
  const today = useToday();
  const [picked, setPicked] = useState<Date | null>(null);
  const current = budgetCycle(today, startDay);
  const cycle = picked && picked < current.start ? budgetCycle(picked, startDay) : current;
  const { data: entries = [] } = useEntries(cycle);
  const { data: recent = [] } = useRecentEntries();

  const expenses = useMemo(
    () => categories.filter((category) => category.kind === 'expense'),
    [categories],
  );
  const { active, idle } = budgetList(expenses, limits, spendByCategory(entries));
  const summary = profile ? summarizeBudget(profile, expenses, limits, entries) : null;
  const recentTotals = spendByCategory(recent);
  const editing = expenses.find((category) => category.id === editingId);
  const money = (value: number) => formatMoney(value, { currency, compact: true });

  const open = (id: string) =>
    router.push({
      pathname: '/budget/[id]',
      params: cycle === current ? { id } : { id, month: toISODate(cycle.start) },
    });
  const edit = (id: string) => {
    setEditingId(id);
    limitSheet.present();
  };
  const rows = (list: typeof active, faded = false) => (
    <Card className="py-1">
      {list.map((row) => (
        <BudgetRow
          key={row.category.id}
          {...row}
          currency={currency}
          idle={faded}
          onOpen={() => open(row.category.id)}
          onEdit={() => edit(row.category.id)}
        />
      ))}
    </Card>
  );

  return (
    <View className="flex-1 bg-canvas">
      <GradientBackground name="sky" height={420} />
      {/* Month, title and the month's bar stay put; only the list scrolls. */}
      <View style={{ paddingTop: layout.headerPaddingTop, paddingHorizontal: 16 }}>
        <TabTopBar>
          <MonthPill label={formatMonthLabel(cycle.start)} onPress={monthSheet.present} />
        </TabTopBar>
        <TabTitle title={t('overview.budgets')} />
        {summary ? (
          <SpendBar
            segments={summary.segments}
            spent={summary.spent}
            total={summary.total}
            currency={currency}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        ) : null}
      </View>

      <ScrollView
        className="mt-5 flex-1"
        contentInsetAdjustmentBehavior={layout.contentInsetAdjustmentBehavior}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        {active.length ? rows(active) : null}
        {idle.length ? (
          <>
            <Text
              size={13}
              weight="semibold"
              className={active.length ? 'mt-6 mb-2 px-1.5 text-muted' : 'mb-2 px-1.5 text-muted'}>
              {t('budgets.noSpending')}
            </Text>
            {rows(idle, true)}
          </>
        ) : null}
      </ScrollView>

      <MonthSheet
        {...monthSheet.controls}
        selected={cycle.start}
        onSelect={(month) => {
          setPicked(new Date(month.getFullYear(), month.getMonth(), startDay));
          monthSheet.dismiss();
        }}
      />
      <BudgetSheet
        open={limitSheet.controls.open}
        onClose={() => {
          limitSheet.dismiss();
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
          if (editing) {
            setLimit.mutate({ id: editing.id, limit });
            // As in the budget settings: a first limit turns category budgets on.
            if (limit !== null && profile?.budget_mode === 'none') {
              updateProfile.mutate({ budget_mode: 'per_category' });
            }
          }
          limitSheet.dismiss();
        }}
      />
    </View>
  );
}

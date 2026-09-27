import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { CategoryAvatar } from '@/features/categories/components/category-avatar';
import { useCategoryLimits } from '@/features/categories/hooks/use-category-limits';
import { useCategoryLookup } from '@/features/categories/hooks/use-category-lookup';
import { categoryIdOf } from '@/features/categories/lib/category-ref';
import { EntryList } from '@/features/entries/components/entry-list';
import { useEntries } from '@/features/entries/hooks/use-entries';
import { groupByDay } from '@/features/entries/lib/entry-stats';
import { useCurrency, useProfile } from '@/features/profile/hooks/use-profile';
import { EmptyCard } from '@/shared/components/empty-card';
import { MoneyText } from '@/shared/components/money-text';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { useToday } from '@/shared/hooks/use-today';
import { huePalette } from '@/shared/lib/color';
import { addDays, budgetCycle, formatLongDate, formatMonth } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

import { categoryTrend, trendTicks } from '../lib/category-trend';
import { TrendChart } from './trend-chart';

const NO_LIMITS = new Map<string, number>();

// Pip holds up money while the pace stays within the limit.
const pipPose = {
  under: 'money',
  onTrack: 'money',
  noLimit: 'money',
  ahead: 'reading',
  over: 'dizzy',
} as const;

const messages = {
  under: 'budgets.trendUnder',
  onTrack: 'budgets.trendOnTrack',
  ahead: 'budgets.trendAhead',
  over: 'budgets.trendOver',
  noLimit: 'budgets.trendNoLimit',
} as const;

// One category in a budget month (2w-e): what's spent, how it compares with
// the limit, the running total as a chart, Pip's forecast and the entries.
// A past month (from the Budgets tab) has no days left or forecast.
export function CategoryBudgetScreen({ id, month: shown }: { id: string; month?: Date }) {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const currency = useCurrency();
  const lookup = useCategoryLookup();
  const { data: limits = NO_LIMITS } = useCategoryLimits();
  const today = useToday();
  const cycle = budgetCycle(shown ?? today, profile?.month_start_day ?? 1);
  const past = cycle.end <= today;
  const { data: all = [] } = useEntries(cycle);

  const category = lookup.get(id);
  const limit = limits.get(id) ?? null;
  const entries = useMemo(
    () => all.filter((entry) => categoryIdOf(entry) === id && entry.kind === 'expense'),
    [all, id],
  );
  const trend = categoryTrend(entries, cycle, limit, past ? addDays(cycle.end, -1) : undefined);
  // Day held on the chart; the header then shows that day instead.
  const [scrub, setScrub] = useState<number | null>(null);
  const ticks = trendTicks(cycle, trend.days);

  if (!profile || !category) return null;
  const money = (value: number) => formatMoney(value, { currency, compact: true });
  const dayAmount = (day: number) => trend.cumulative[day] - (trend.cumulative[day - 1] ?? 0);
  const month = formatMonth(cycle.start);
  const percent = limit ? Math.round((trend.spent / limit) * 100) : null;
  const daysLeft =
    trend.daysLeft === 0 ? t('budgets.lastDay') : t('budgets.daysLeft', { count: trend.daysLeft });

  return (
    <Screen gradient="sky" gradientHeight={420} scroll inset={16}>
      <ScreenHeader trailing={null}>
        <View className="flex-1 flex-row items-center justify-center gap-2">
          <CategoryAvatar icon={category.icon} hue={category.hue} size={32} />
          <Text size={16} weight="semibold" numberOfLines={1}>
            {category.name}
          </Text>
        </View>
        <View className="w-[34px]" />
      </ScreenHeader>

      <View className="mt-7 items-center">
        <Text size={15} weight="medium" className="text-muted">
          {scrub === null
            ? t('budgets.inMonth', { month })
            : t('budgets.untilDay', { date: formatLongDate(addDays(cycle.start, scrub)) })}
        </Text>
        <MoneyText
          amount={scrub === null ? trend.spent : trend.cumulative[scrub]}
          currency={currency}
          danger={scrub === null && trend.status === 'over'}
          className="mt-3.5"
        />
        {scrub !== null ? (
          <Text size={15} className="mt-2.5 text-muted">
            {dayAmount(scrub) > 0
              ? t('budgets.onDay', { amount: money(dayAmount(scrub)) })
              : t('budgets.noSpendOnDay')}
          </Text>
        ) : (
          <Text size={15} className="mt-2.5 text-muted">
            {percent !== null ? (
              <>
                <Text
                  size={15}
                  weight="semibold"
                  style={{
                    color:
                      trend.status === 'over' ? undefined : huePalette(category.hue).foreground,
                  }}
                  className={trend.status === 'over' ? 'text-danger-text' : undefined}>
                  {`${percent} %`}
                </Text>
                {` ${t('budgets.ofLimit', { limit: money(limit!) })}`}
                {past ? '' : ' · '}
              </>
            ) : null}
            {past ? null : daysLeft}
          </Text>
        )}
      </View>

      <View className="mt-7">
        <TrendChart trend={trend} hue={category.hue} ticks={ticks} onScrub={setScrub} />
      </View>

      {/* A forecast needs spending, and a past month has nothing left to forecast. */}
      {past || !entries.length ? null : (
        <View className="mt-6 flex-row items-center gap-3 px-1">
          <Pip pose={pipPose[trend.status]} size={52} />
          <Text size={15} leading={1.4} className="flex-1 text-ink-soft">
            <Trans
              i18nKey={messages[trend.status]}
              values={{
                amount: money(trend.status === 'over' ? trend.spent - limit! : trend.projected),
              }}
              components={{ b: <Text size={15} weight="semibold" /> }}
            />
          </Text>
        </View>
      )}

      {/* Grouped by day with the day's total, as on Einträge. */}
      {entries.length ? (
        <View className="mt-8">
          <EntryList groups={groupByDay(entries)} categories={lookup} currency={currency} />
        </View>
      ) : (
        <EmptyCard
          pose="write"
          title={past ? t('budgets.emptyTitlePast', { month }) : t('budgets.emptyTitle')}
          subtitle={
            past
              ? t('budgets.emptySubtitlePast', { category: category.name })
              : t('budgets.emptySubtitle', { category: category.name })
          }
          className="mt-8"
        />
      )}
    </Screen>
  );
}

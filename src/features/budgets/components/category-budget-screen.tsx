import { router } from 'expo-router';
import { useMemo } from 'react';
import { View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { CategoryAvatar } from '@/features/categories/components/category-avatar';
import { useCategoryLimits } from '@/features/categories/hooks/use-category-limits';
import { useCategoryLookup } from '@/features/categories/hooks/use-category-lookup';
import { categoryIdOf } from '@/features/categories/lib/category-ref';
import { EntryRow } from '@/features/entries/components/entry-row';
import { useEntries } from '@/features/entries/hooks/use-entries';
import { entryAmount, entryVisual } from '@/features/entries/lib/entry-display';
import { useCurrency, useProfile } from '@/features/profile/hooks/use-profile';
import { MoneyText } from '@/shared/components/money-text';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { huePalette } from '@/shared/lib/color';
import { budgetCycle, formatDayLabel, formatMonth } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { Card } from '@/shared/ui/card';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

import { categoryTrend, trendTicks } from '../lib/category-trend';
import { TrendChart } from './trend-chart';

const NO_LIMITS = new Map<string, number>();

const messages = {
  under: 'budgets.trendUnder',
  onTrack: 'budgets.trendOnTrack',
  ahead: 'budgets.trendAhead',
  over: 'budgets.trendOver',
  noLimit: 'budgets.trendNoLimit',
} as const;

// One category this budget month (2w-e): what's spent, how it compares with
// the limit, the running total as a chart, Pip's forecast and the entries.
export function CategoryBudgetScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const currency = useCurrency();
  const lookup = useCategoryLookup();
  const { data: limits = NO_LIMITS } = useCategoryLimits();
  const cycle = budgetCycle(new Date(), profile?.month_start_day ?? 1);
  const { data: all = [] } = useEntries(cycle);

  const category = lookup.get(id);
  const limit = limits.get(id) ?? null;
  const entries = useMemo(
    () => all.filter((entry) => categoryIdOf(entry) === id && entry.kind === 'expense'),
    [all, id],
  );
  const trend = categoryTrend(entries, cycle, limit);
  const ticks = trendTicks(cycle, trend.days);

  if (!profile || !category) return null;
  const money = (value: number) => formatMoney(value, { currency, compact: true });
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
          {t('budgets.inMonth', { month })}
        </Text>
        <MoneyText
          amount={trend.spent}
          currency={currency}
          danger={trend.status === 'over'}
          className="mt-2"
        />
        <Text size={15} className="mt-2.5 text-muted">
          {percent !== null ? (
            <Text
              size={15}
              weight="semibold"
              style={{
                color: trend.status === 'over' ? undefined : huePalette(category.hue).foreground,
              }}
              className={trend.status === 'over' ? 'text-danger-text' : undefined}>
              {`${percent} %`}
            </Text>
          ) : null}
          {percent !== null ? ` ${t('budgets.ofLimit', { limit: money(limit!) })} · ` : ''}
          {daysLeft}
        </Text>
      </View>

      <View className="mt-7">
        <TrendChart trend={trend} hue={category.hue} ticks={ticks} />
      </View>

      <View className="mt-6 flex-row items-center gap-3 px-1">
        <View className="size-12 items-center justify-center overflow-hidden rounded-full bg-primary-tint">
          <Pip pose={trend.status === 'over' ? 'dizzy' : 'reading'} size={44} />
        </View>
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

      <Text size={20} weight="semibold" tracking={-0.02} className="mt-8 mb-2.5 px-1">
        {t('budgets.inMonth', { month })}
      </Text>
      {entries.length ? (
        <Card className="py-1">
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              {...entryVisual(entry.kind, category)}
              title={entry.title}
              subtitle={formatDayLabel(new Date(entry.occurred_at))}
              amount={entryAmount(entry, currency)}
              onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })}
            />
          ))}
        </Card>
      ) : (
        <Text variant="body" className="px-1 pt-2 text-center">
          {t('budgets.noEntriesYet')}
        </Text>
      )}
    </Screen>
  );
}

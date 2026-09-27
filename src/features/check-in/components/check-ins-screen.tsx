import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrency } from '@/features/profile/hooks/use-profile';
import { GradientBackground } from '@/shared/components/gradient-background';
import { StatusHero } from '@/shared/components/status-hero';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { formatMonth, formatWeekRange } from '@/shared/lib/dates';
import { huePalette } from '@/shared/lib/color';
import { formatMoney } from '@/shared/lib/money';
import { tabScrollProps } from '@/shared/lib/tab-insets';
import { colors } from '@/shared/lib/theme';
import { Card } from '@/shared/ui/card';
import { Chip } from '@/shared/ui/chip';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

import type { CheckIn } from '../data/check-ins-api';
import { useCheckIns } from '../hooks/use-check-ins';
import {
  averageAccuracy,
  type CheckInPeriod,
  checkInYears,
  filterCheckIns,
  groupByMonth,
  weekOf,
} from '../lib/check-in-list';
import { checkInAccuracy } from '../lib/check-in-window';
import { CheckInHero } from './check-in-hero';

const GREEN = huePalette(150);

function CheckInRow({ checkIn, detail }: { checkIn: CheckIn; detail: string }) {
  const { checkInCloseRatio } = useAppConfig();
  const accuracy = checkInAccuracy(checkIn);
  const close = accuracy !== null && accuracy >= checkInCloseRatio;
  return (
    <View className="flex-row items-center gap-3.5 px-4 py-3">
      <View
        className="size-11 items-center justify-center rounded-full"
        style={{ backgroundColor: close ? GREEN.background : colors.primaryTint }}>
        <Icon
          name={accuracy === null ? 'minus' : close ? 'target' : 'arrows-horizontal'}
          size={20}
          color={close ? GREEN.foreground : colors.mutedSoft}
        />
      </View>
      <View className="min-w-0 flex-1 gap-0.5">
        <Text size={16} weight="semibold" tracking={-0.01}>
          {formatWeekRange(weekOf(checkIn))}
        </Text>
        <Text size={13.5} className="text-subtle" numberOfLines={1}>
          {detail}
        </Text>
      </View>
      <Text size={16} weight="semibold" style={{ fontVariant: ['tabular-nums'] }}>
        {accuracy === null ? '–' : `${Math.round(accuracy * 100)} %`}
      </Text>
    </View>
  );
}

// Check-ins tab (5t-m): this week's check-in as a big card, then every past
// one with search and period chips, grouped by month.
export function CheckInsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const scroll = tabScrollProps(insets.top, 4);
  const currency = useCurrency();
  const { data: checkIns = [] } = useCheckIns();
  const [query, setQuery] = useState('');
  const [period, setPeriod] = useState<CheckInPeriod>('all');

  const money = (value: number) => formatMoney(value, { currency, compact: true });
  const detail = (checkIn: CheckIn) =>
    checkIn.guess === null
      ? t('checkIn.skipped')
      : t('checkIn.rowDetail', {
          guess: money(Number(checkIn.guess)),
          actual: money(Number(checkIn.actual ?? 0)),
        });

  const average = averageAccuracy(checkIns);
  const years = useMemo(() => checkInYears(checkIns), [checkIns]);
  const thisYear = new Date().getFullYear();
  const groups = groupByMonth(
    filterCheckIns(
      checkIns,
      period,
      query,
      (checkIn) => `${formatWeekRange(weekOf(checkIn))} ${detail(checkIn)}`,
    ),
  );

  const periods: { value: CheckInPeriod; label: string }[] = [
    { value: 'all', label: t('entries.all') },
    { value: 'recent', label: t('checkIn.lastMonths') },
    ...years.map((year) => ({ value: year, label: String(year) })),
  ];

  return (
    <View className="flex-1 bg-canvas">
      <GradientBackground name="sky" height={420} />
      <ScrollView
        contentInsetAdjustmentBehavior={scroll.contentInsetAdjustmentBehavior}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          paddingTop: scroll.paddingTop,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}>
        <View className="h-10 flex-row items-center justify-between px-1">
          <Text size={34} weight="bold" tracking={-0.04} leading={1.05}>
            {t('checkIn.title')}
          </Text>
          {average !== null ? (
            <Text size={14.5} className="text-muted">
              <Text size={14.5} weight="semibold">
                {`Ø ${Math.round(average * 100)} %`}
              </Text>
              {` · ${checkIns.length}`}
            </Text>
          ) : null}
        </View>

        <CheckInHero currency={currency} />

        {checkIns.length === 0 ? (
          <StatusHero
            className="mt-10"
            pose="clock"
            title={t('checkIn.historyEmpty')}
            subtitle={t('checkIn.historyEmptySubtitle')}
          />
        ) : (
          <>
            <TextField
              containerClassName="mt-[18px]"
              size="md"
              leadingIcon="magnifying-glass"
              placeholder={t('common.search')}
              value={query}
              onChangeText={setQuery}
              clearable
              returnKeyType="search"
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-4 mt-3"
              style={{ height: 36, flexGrow: 0, flexShrink: 0 }}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
              {periods.map((option) => (
                <Chip
                  key={option.value}
                  label={option.label}
                  size="sm"
                  variant={period === option.value ? 'dark' : 'outline'}
                  onPress={() => setPeriod(option.value)}
                />
              ))}
            </ScrollView>

            <View className="mt-3.5 gap-3">
              {groups.length ? (
                groups.map((group) => (
                  <View key={group.key} className="gap-2">
                    <Text size={13} weight="semibold" className="px-1.5 text-muted capitalize">
                      {formatMonth(group.date, group.date.getFullYear() !== thisYear)}
                    </Text>
                    <Card className="py-1">
                      {group.checkIns.map((checkIn) => (
                        <CheckInRow key={checkIn.id} checkIn={checkIn} detail={detail(checkIn)} />
                      ))}
                    </Card>
                  </View>
                ))
              ) : (
                <Text variant="body" className="px-1 pt-6 text-center">
                  {t('checkIn.noResults')}
                </Text>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCurrency } from '@/features/profile/hooks/use-profile';
import { GradientBackground } from '@/shared/components/gradient-background';
import { MonthSheet } from '@/shared/components/month-sheet';
import { useSheet } from '@/shared/components/sheet';
import { ChipRow, MonthPill, TabTitle } from '@/shared/components/tab-header';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { formatMonthLabel, formatWeekRange, monthRange } from '@/shared/lib/dates';
import { huePalette } from '@/shared/lib/color';
import { tabListProps } from '@/shared/lib/tab-insets';
import { colors } from '@/shared/lib/theme';
import { Card } from '@/shared/ui/card';
import { Chip } from '@/shared/ui/chip';
import { Icon } from '@/shared/ui/icon';
import { Pip } from '@/shared/ui/pip';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import type { CheckIn } from '../data/check-ins-api';
import { useCheckIns } from '../hooks/use-check-ins';
import {
  averageAccuracy,
  checkInDetail,
  type CheckInPeriod,
  checkInYears,
  filterCheckIns,
  groupByMonth,
  weekOf,
} from '../lib/check-in-list';
import { checkInAccuracy, formatAccuracy } from '../lib/check-in-window';
import { CheckInHero } from './check-in-hero';

const GREEN = huePalette(150);

function CheckInRow({ checkIn, currency }: { checkIn: CheckIn; currency: string }) {
  const { checkInCloseRatio } = useAppConfig();
  const accuracy = checkInAccuracy(checkIn);
  const close = accuracy !== null && accuracy >= checkInCloseRatio;
  const skipped = checkIn.guess === null;
  const className = 'flex-row items-center gap-3.5 px-4 py-3';
  const content = (
    <>
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
          {checkInDetail(checkIn, currency)}
        </Text>
      </View>
      <Text size={16} weight="semibold" style={{ fontVariant: ['tabular-nums'] }}>
        {formatAccuracy(checkIn)}
      </Text>
    </>
  );
  // Skipped weeks have no result to open, so they don't react to taps.
  if (skipped) return <View className={className}>{content}</View>;
  return (
    <Pressable
      accessibilityLabel={formatWeekRange(weekOf(checkIn))}
      onPress={() =>
        router.push({ pathname: '/check-in/result', params: { week: checkIn.week_start } })
      }
      className={className}>
      {content}
    </Pressable>
  );
}

// Check-ins tab (5t-m): this week's check-in as a big card, then every past
// one with period chips and a month pill, grouped by month.
export function CheckInsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const layout = tabListProps(insets.top);
  const currency = useCurrency();
  const { data: checkIns = [] } = useCheckIns();
  const [period, setPeriod] = useState<CheckInPeriod>('all');
  const monthSheet = useSheet();

  const average = averageAccuracy(checkIns);
  const years = useMemo(() => checkInYears(checkIns), [checkIns]);
  const groups = groupByMonth(filterCheckIns(checkIns, period));

  const periods: { value: Exclude<CheckInPeriod, object>; label: string }[] = [
    { value: 'all', label: t('entries.all') },
    { value: 'recent', label: t('checkIn.lastMonths') },
    ...years.map((year) => ({ value: year, label: String(year) })),
  ];

  return (
    <View className="flex-1 bg-canvas">
      <GradientBackground name="sky" height={420} />
      {/* Month, title, this week's card and chips stay put; only the
          history scrolls. */}
      <View style={{ paddingTop: layout.headerPaddingTop, paddingHorizontal: 16 }}>
        <MonthPill
          label={
            typeof period === 'object' ? formatMonthLabel(period.start) : t('checkIn.allMonths')
          }
          onPress={monthSheet.present}
        />
        <TabTitle
          title={t('checkIn.title')}
          value={average !== null ? `Ø ${Math.round(average * 100)} %` : undefined}
          count={checkIns.length}
        />
        <CheckInHero currency={currency} />
        {checkIns.length ? (
          <ChipRow className="mt-[18px]">
            {periods.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                size="sm"
                variant={period === option.value ? 'dark' : 'outline'}
                onPress={() => setPeriod(option.value)}
              />
            ))}
          </ChipRow>
        ) : null}
      </View>

      {checkIns.length === 0 ? (
        <ScrollView
          className="flex-1"
          contentInsetAdjustmentBehavior={layout.contentInsetAdjustmentBehavior}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}>
          <Card className="mt-[18px] items-center rounded-[28px] px-5 pt-[22px] pb-6">
            <Pip pose="clock" size={120} />
            <Text variant="heading" className="mt-3">
              {t('checkIn.historyEmpty')}
            </Text>
            <Text
              size={15}
              leading={1.45}
              className="mt-2 max-w-[280px] text-center text-muted-soft">
              {t('checkIn.historyEmptySubtitle')}
            </Text>
          </Card>
        </ScrollView>
      ) : groups.length === 0 ? (
        <View className="mt-3.5 flex-1 px-4">
          <Text variant="body" className="px-1 pt-6 text-center">
            {t('checkIn.noResults')}
          </Text>
        </View>
      ) : (
        <ScrollView
          // The gap sits outside the list, as on Einträge, so rows scroll
          // out of view below the chips instead of right against them.
          className="mt-3.5 flex-1"
          contentInsetAdjustmentBehavior={layout.contentInsetAdjustmentBehavior}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}>
          <View className="gap-3">
            {groups.map((group) => (
              <View key={group.key} className="gap-2">
                <Text size={13} weight="semibold" className="px-1.5 text-muted capitalize">
                  {formatMonthLabel(group.date)}
                </Text>
                <Card className="py-1">
                  {group.checkIns.map((checkIn) => (
                    <CheckInRow key={checkIn.id} checkIn={checkIn} currency={currency} />
                  ))}
                </Card>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
      <MonthSheet
        {...monthSheet.controls}
        selected={typeof period === 'object' ? period.start : new Date()}
        onSelect={(month) => {
          setPeriod(monthRange(month));
          monthSheet.dismiss();
        }}
      />
    </View>
  );
}

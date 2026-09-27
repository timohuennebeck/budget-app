import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MonthSheet } from '@/features/entries/components/month-sheet';
import { useCurrency } from '@/features/profile/hooks/use-profile';
import { GradientBackground } from '@/shared/components/gradient-background';
import { useSheet } from '@/shared/components/sheet';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { formatMonth, formatWeekRange } from '@/shared/lib/dates';
import { huePalette } from '@/shared/lib/color';
import { formatMoney } from '@/shared/lib/money';
import { tabListProps } from '@/shared/lib/tab-insets';
import { colors, shadows } from '@/shared/lib/theme';
import { Card } from '@/shared/ui/card';
import { Chip } from '@/shared/ui/chip';
import { Icon } from '@/shared/ui/icon';
import { IconButton } from '@/shared/ui/icon-button';
import { Pip } from '@/shared/ui/pip';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

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
          {detail}
        </Text>
      </View>
      <Text size={16} weight="semibold" style={{ fontVariant: ['tabular-nums'] }}>
        {accuracy === null ? '–' : `${Math.round(accuracy * 100)} %`}
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
// one with search and period chips, grouped by month.
export function CheckInsScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const layout = tabListProps(insets.top, 4);
  const currency = useCurrency();
  const { data: checkIns = [] } = useCheckIns();
  const [period, setPeriod] = useState<CheckInPeriod>('all');
  const monthSheet = useSheet();

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
  const groups = groupByMonth(filterCheckIns(checkIns, period));

  const periods: { value: Exclude<CheckInPeriod, Date>; label: string }[] = [
    { value: 'all', label: t('entries.all') },
    { value: 'recent', label: t('checkIn.lastMonths') },
    ...years.map((year) => ({ value: year, label: String(year) })),
  ];

  return (
    <View className="flex-1 bg-canvas">
      <GradientBackground name="sky" height={420} />
      {/* Month, title, this week's card, search and chips stay put; only the
          history scrolls. */}
      <View style={{ paddingTop: layout.headerPaddingTop, paddingHorizontal: 16 }}>
        <View className="flex-row items-center justify-between px-1">
          <Pressable
            onPress={monthSheet.present}
            haptic="none"
            accessibilityLabel={t('entries.chooseMonth')}
            className="flex-row items-center gap-2 rounded-full bg-surface px-3.5 py-[9px]"
            style={shadows.card}>
            <Text size={15} weight="semibold" tracking={-0.01} className="capitalize">
              {period instanceof Date
                ? formatMonth(period, period.getFullYear() !== thisYear)
                : t('checkIn.allMonths')}
            </Text>
            <Icon name="caret-down" size={11} color={colors.primary} />
          </Pressable>
          <IconButton
            icon="calendar-blank"
            variant="surface"
            size={40}
            iconSize={18}
            accessibilityLabel={t('calendar.title')}
            onPress={() => router.push('/calendar')}
          />
        </View>

        <View className="mt-[22px] flex-row items-baseline justify-between px-1">
          <Text size={34} weight="semibold" tracking={-0.04} leading={1.05}>
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
        {checkIns.length ? (
          <>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="-mx-4 mt-[18px]"
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
          </>
        ) : null}
      </View>

      <ScrollView
        // The gap sits outside the list, as on Einträge, so rows scroll
        // out of view below the chips instead of right against them.
        className={checkIns.length ? 'mt-3.5 flex-1' : 'flex-1'}
        contentInsetAdjustmentBehavior={layout.contentInsetAdjustmentBehavior}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        {checkIns.length === 0 ? (
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
        ) : (
          <View className="gap-3">
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
        )}
      </ScrollView>
      <MonthSheet
        {...monthSheet.controls}
        selected={period instanceof Date ? period : new Date()}
        onSelect={(month) => {
          setPeriod(month);
          monthSheet.dismiss();
        }}
      />
    </View>
  );
}

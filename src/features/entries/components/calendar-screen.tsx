import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCategoryLookup } from '@/features/categories/hooks/use-category-lookup';
import { useCurrency } from '@/features/profile/hooks/use-profile';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { Sheet, useSheet } from '@/shared/components/sheet';
import {
  addDays,
  formatLongDate,
  formatMonth,
  formatShortDate,
  formatWeekday,
  isSameDay,
  monthRange,
  startOfDay,
  weekdayInitials,
  weekRange,
} from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { colors, shadows } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

import { useEntries } from '../hooks/use-entries';
import { entryAmount, entrySubtitle, entryVisual } from '../lib/entry-display';
import { groupByDay } from '../lib/entry-stats';
import { CalendarDay, type DayTone } from './calendar-day';
import { EntryRow } from './entry-row';

const compactNumber = (value: number) => {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : '';
  return `${sign}${Math.abs(rounded).toLocaleString()}`;
};

// Monthly calendar (4b3): each day shows its net amount; tapping a day
// opens a sheet with that day's entries.
export function CalendarScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ month?: string }>();
  const month = useMemo(
    () => monthRange(params.month ? new Date(params.month) : new Date()),
    [params.month],
  );
  const { data: entries = [] } = useEntries(month);
  const lookup = useCategoryLookup();
  const sheet = useSheet();
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const currency = useCurrency();
  const today = startOfDay(new Date());

  const byDay = useMemo(
    () => new Map(groupByDay(entries).map((group) => [group.date.getTime(), group])),
    [entries],
  );
  const weeks = useMemo(() => {
    const first = weekRange(month.start).start;
    const rows: Date[][] = [];
    for (let cursor = first; cursor < month.end; cursor = addDays(cursor, 7)) {
      rows.push(Array.from({ length: 7 }, (_, index) => addDays(cursor, index)));
    }
    return rows;
  }, [month]);

  const toneFor = (date: Date): DayTone => {
    if (date < month.start || date >= month.end) return 'outside';
    if (date > today) return 'future';
    const group = byDay.get(date.getTime());
    if (!group) return 'empty';
    return group.total >= 0 ? 'income' : 'expense';
  };

  const selectedGroup = byDay.get(selected.getTime());

  return (
    <Screen gradient="sky" inset={16}>
      <ScreenHeader>
        <View className="flex-1 items-center">
          <View className="rounded-full bg-surface px-3.5 py-[9px]" style={shadows.card}>
            <Text size={15} weight="semibold" tracking={-0.01} className="capitalize">
              {formatMonth(month.start, true)}
            </Text>
          </View>
        </View>
      </ScreenHeader>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mt-5 gap-1.5 px-1">
          <Text size={34} weight="bold" tracking={-0.04} leading={1.05}>
            {t('calendar.title')}
          </Text>
          <Text size={14.5} className="text-muted-soft">
            {t('calendar.selected', { date: formatShortDate(selected) })}
          </Text>
        </View>
        <View className="mt-[18px] flex-row gap-1.5">
          {weekdayInitials().map((label) => (
            <Text
              key={label}
              size={12.5}
              weight="semibold"
              className="flex-1 text-center text-subtle">
              {label}
            </Text>
          ))}
        </View>
        <View className="mt-2.5 gap-2">
          {weeks.map((week) => (
            <View key={week[0].getTime()} className="flex-row gap-1.5">
              {week.map((date) => {
                const tone = toneFor(date);
                const group = byDay.get(date.getTime());
                return (
                  <CalendarDay
                    key={date.getTime()}
                    day={date.getDate()}
                    tone={tone}
                    label={group ? compactNumber(group.total) : undefined}
                    selected={isSameDay(date, selected)}
                    onPress={
                      tone === 'expense' || tone === 'income' || tone === 'empty'
                        ? () => {
                            setSelected(date);
                            if (group) sheet.present();
                          }
                        : undefined
                    }
                  />
                );
              })}
            </View>
          ))}
        </View>
        <View className="mt-3 flex-row gap-3.5 px-1">
          {[
            { color: colors.calendarRed, label: t('calendar.expense') },
            { color: colors.primary, label: t('calendar.income') },
          ].map((item) => (
            <View key={item.label} className="flex-row items-center gap-1.5">
              <View className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <Text size={12.5} className="text-muted-soft">
                {item.label}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <Sheet {...sheet.controls} height={430}>
        <View className="mt-3.5 flex-row items-end justify-between">
          <View className="gap-0.5">
            <Text size={13.5} weight="medium" className="text-subtle">
              {formatWeekday(selected)}
            </Text>
            <Text size={24} weight="bold" tracking={-0.03}>
              {formatLongDate(selected)}
            </Text>
          </View>
          {selectedGroup ? (
            <Text
              size={22}
              weight="bold"
              tracking={-0.03}
              style={{ color: selectedGroup.total < 0 ? colors.calendarRed : colors.primary }}>
              {formatMoney(selectedGroup.total, { currency, signed: true })}
            </Text>
          ) : null}
        </View>
        <ScrollView className="mt-2.5 flex-1" showsVerticalScrollIndicator={false}>
          {selectedGroup?.entries.map((entry) => {
            const category = entry.category_id ? lookup.get(entry.category_id) : undefined;
            return (
              <EntryRow
                key={entry.id}
                compact
                {...entryVisual(entry.kind, category)}
                title={entry.title}
                subtitle={entrySubtitle(entry, category?.name)}
                amount={entryAmount(entry, currency)}
                onPress={() => {
                  sheet.dismiss();
                  router.push({ pathname: '/entry/[id]', params: { id: entry.id } });
                }}
              />
            );
          })}
        </ScrollView>
        <Button className="mt-3 h-[54px]" label={t('common.done')} onPress={sheet.dismiss} />
      </Sheet>
    </Screen>
  );
}

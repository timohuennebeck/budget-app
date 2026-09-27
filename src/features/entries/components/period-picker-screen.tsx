import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ScreenHeader } from '@/shared/components/screen-header';
import { cn } from '@/shared/lib/cn';
import {
  addDays,
  type DateRange,
  formatLongDate,
  formatMonth,
  isSameDay,
  monthRange,
  startOfDay,
  weekdayInitials,
  weekRange,
} from '@/shared/lib/dates';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Chip } from '@/shared/ui/chip';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { type PeriodTarget, usePeriodStore } from '../data/period-store';

const MONTHS_BACK = 24;
const CELL_HEIGHT = 44;

interface Selection {
  from: Date | null;
  /** Inclusive last day; null while only the start is picked */
  till: Date | null;
}

interface MonthGridProps extends Selection {
  month: DateRange;
  today: Date;
  onPick: (day: Date) => void;
}

/** One month of days; the picked range is a band with round ends. */
function MonthGrid({ month, from, till, today, onPick }: MonthGridProps) {
  const last = till ?? from;
  const hasRange = !!from && !!till && !isSameDay(from, till);
  const weeks: Date[][] = [];
  for (let cursor = weekRange(month.start).start; cursor < month.end; cursor = addDays(cursor, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, index) => addDays(cursor, index)));
  }

  return (
    <View>
      {weeks.map((week) => (
        <View key={week[0].getTime()} className="flex-row">
          {week.map((day) => {
            if (day < month.start || day >= month.end) {
              return <View key={day.getTime()} className="flex-1" />;
            }
            const future = day > today;
            const isStart = !!from && isSameDay(day, from);
            const isEnd = !!last && isSameDay(day, last);
            const inside = !!from && !!last && day > from && day < last;
            const content = (
              <>
                {inside || (hasRange && (isStart || isEnd)) ? (
                  <View
                    className="absolute inset-y-[4px] bg-primary-wash"
                    style={{ left: isStart ? '50%' : 0, right: isEnd ? '50%' : 0 }}
                  />
                ) : null}
                <View
                  className={cn(
                    'size-9 items-center justify-center rounded-full',
                    (isStart || isEnd) && 'bg-primary',
                  )}>
                  <Text
                    size={15.5}
                    weight={isStart || isEnd || isSameDay(day, today) ? 'semibold' : 'regular'}
                    style={{
                      color:
                        isStart || isEnd
                          ? colors.white
                          : future
                            ? colors.chevron
                            : isSameDay(day, today)
                              ? colors.primary
                              : colors.ink,
                      fontVariant: ['tabular-nums'],
                    }}>
                    {day.getDate()}
                  </Text>
                </View>
              </>
            );
            // Days after today can't be picked and don't react to taps.
            if (future) {
              return (
                <View
                  key={day.getTime()}
                  className="flex-1 items-center justify-center"
                  style={{ height: CELL_HEIGHT }}>
                  {content}
                </View>
              );
            }
            return (
              <Pressable
                key={day.getTime()}
                haptic="select"
                accessibilityLabel={`${formatLongDate(day)} ${day.getFullYear()}`}
                onPress={() => onPick(day)}
                className="flex-1 items-center justify-center"
                style={{ height: CELL_HEIGHT }}>
                {content}
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// Period page behind the pill on Einträge and Check-ins: Von / Bis, quick
// picks and the past months as one scrolling list. First tap sets the start,
// the second the end; "Fertig" hands the range back and returns.
export function PeriodPickerScreen({ target }: { target: PeriodTarget }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const stored = usePeriodStore((state) => state.ranges[target]);
  const setRange = usePeriodStore((state) => state.setRange);
  const today = startOfDay(new Date());
  const initial = stored ?? (target === 'entries' ? monthRange(today) : null);
  const [{ from, till }, setSelection] = useState<Selection>({
    from: initial ? startOfDay(initial.start) : null,
    till: initial ? addDays(initial.end, -1) : null,
  });

  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: MONTHS_BACK + 1 }, (_, index) =>
      monthRange(new Date(now.getFullYear(), now.getMonth() - MONTHS_BACK + index, 1)),
    );
  }, []);

  // Opens at the month of the current start (or this month); quick picks
  // scroll to theirs.
  const scroll = useRef<ScrollView>(null);
  const monthTops = useRef(new Map<number, number>());
  const [openAt] = useState(() => monthRange(initial?.start ?? today).start.getTime());
  const scrollToMonth = (day: Date, animated: boolean) => {
    const y = monthTops.current.get(monthRange(day).start.getTime());
    if (y !== undefined) scroll.current?.scrollTo({ y, animated });
  };

  const pick = (day: Date) =>
    setSelection((current) => {
      if (!current.from || current.till) return { from: day, till: null };
      if (day < current.from) return { from: day, till: null };
      return { from: current.from, till: day };
    });

  const thisMonth = monthRange(today);
  const presets = [
    { label: t('range.thisMonth'), range: thisMonth },
    { label: t('range.lastMonth'), range: monthRange(addDays(thisMonth.start, -1)) },
    { label: t('range.last30Days'), range: { start: addDays(today, -29), end: addDays(today, 1) } },
  ];
  const isPreset = (range: DateRange) =>
    !!from && !!till && isSameDay(from, range.start) && isSameDay(till, addDays(range.end, -1));
  const choose = (range: DateRange) => {
    setSelection({ from: range.start, till: addDays(range.end, -1) });
    scrollToMonth(range.start, true);
  };

  // Its own layout rather than <Screen>: only the month list scrolls, so it
  // needs a bounded height between the fixed top and the button.
  return (
    <View className="flex-1 bg-canvas" style={{ paddingTop: insets.top + 4 }}>
      <View className="flex-1 px-5">
        <ScreenHeader />

        <View className="mt-5 flex-row gap-2.5">
          {[
            { label: t('range.from'), date: from, active: !from || !!till },
            { label: t('range.till'), date: till, active: !!from && !till },
          ].map((field) => (
            <View
              key={field.label}
              className={cn(
                'flex-1 gap-0.5 rounded-2xl border px-3.5 py-2.5',
                field.active ? 'border-primary bg-primary-wash' : 'border-line bg-surface',
              )}>
              <Text size={12.5} weight="medium" className="text-muted-soft">
                {field.label}
              </Text>
              <Text size={16} weight="semibold" className={field.date ? undefined : 'text-faint'}>
                {field.date ? formatLongDate(field.date) : '–'}
              </Text>
            </View>
          ))}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5 mt-3"
          // Fixed height: on web a horizontal ScrollView in a column stretches.
          style={{ height: 36, flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}>
          {presets.map((preset) => (
            <Chip
              key={preset.label}
              label={preset.label}
              size="sm"
              variant={isPreset(preset.range) ? 'dark' : 'outline'}
              onPress={() => choose(preset.range)}
            />
          ))}
        </ScrollView>

        <View className="mt-5 flex-row border-b border-line pb-2">
          {weekdayInitials().map((label) => (
            <Text
              key={label}
              size={12.5}
              weight="medium"
              className="flex-1 text-center text-subtle">
              {label}
            </Text>
          ))}
        </View>

        <ScrollView
          ref={scroll}
          className="-mx-5 flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}>
          {months.map((month) => (
            <View
              key={month.start.getTime()}
              onLayout={(event) => {
                monthTops.current.set(month.start.getTime(), event.nativeEvent.layout.y);
                if (month.start.getTime() === openAt) scrollToMonth(month.start, false);
              }}>
              <Text size={16} weight="semibold" className="mt-5 mb-2 px-1 capitalize">
                {formatMonth(month.start, true)}
              </Text>
              <MonthGrid month={month} from={from} till={till} today={today} onPick={pick} />
            </View>
          ))}
        </ScrollView>
      </View>
      <View className="px-5 pt-3" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
        <Button
          label={t('common.done')}
          disabled={!from}
          onPress={() => {
            if (!from) return;
            setRange(target, { start: from, end: addDays(till ?? from, 1) });
            router.back();
          }}
        />
      </View>
    </View>
  );
}

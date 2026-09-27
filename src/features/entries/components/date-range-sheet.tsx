import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Sheet, type SheetControls } from '@/shared/components/sheet';
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
import { IconButton } from '@/shared/ui/icon-button';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

const CELL_HEIGHT = 42;

interface DateRangeSheetProps extends SheetControls {
  /** Current range (end exclusive), or null for none */
  value: DateRange | null;
  onSelect: (range: DateRange) => void;
}

interface RangeBodyProps {
  value: DateRange | null;
  onSelect: (range: DateRange) => void;
}

function RangeBody({ value, onSelect }: RangeBodyProps) {
  const { t } = useTranslation();
  const today = startOfDay(new Date());
  const [from, setFrom] = useState<Date | null>(value ? startOfDay(value.start) : null);
  // Inclusive last day; null while only the start is picked.
  const [till, setTill] = useState<Date | null>(value ? addDays(value.end, -1) : null);
  const [shown, setShown] = useState(() => monthRange(value?.start ?? today).start);
  const month = monthRange(shown);
  const atThisMonth = month.end > today;

  const weeks = useMemo(() => {
    const rows: Date[][] = [];
    for (
      let cursor = weekRange(month.start).start;
      cursor < month.end;
      cursor = addDays(cursor, 7)
    ) {
      rows.push(Array.from({ length: 7 }, (_, index) => addDays(cursor, index)));
    }
    return rows;
  }, [month.start, month.end]);

  // First tap sets the start, the second the end (or a new start if earlier).
  const pick = (day: Date) => {
    if (!from || till) {
      setFrom(day);
      setTill(null);
    } else if (day < from) {
      setFrom(day);
    } else {
      setTill(day);
    }
  };

  const apply = (range: DateRange) => {
    setFrom(range.start);
    setTill(addDays(range.end, -1));
    setShown(monthRange(range.start).start);
  };
  const thisMonth = monthRange(today);
  const lastMonth = monthRange(addDays(thisMonth.start, -1));
  const presets = [
    { label: t('range.thisMonth'), range: thisMonth },
    { label: t('range.lastMonth'), range: lastMonth },
    { label: t('range.last30Days'), range: { start: addDays(today, -29), end: addDays(today, 1) } },
  ];
  const last = till ?? from;
  const isPreset = (range: DateRange) =>
    !!from && !!till && isSameDay(from, range.start) && isSameDay(till, addDays(range.end, -1));

  return (
    <>
      <View className="mt-4 flex-row gap-2.5">
        {[
          { label: t('range.from'), date: from, active: !from || !!till },
          { label: t('range.till'), date: till, active: !!from && !till },
        ].map((field) => (
          <View
            key={field.label}
            className={cn(
              'flex-1 gap-0.5 rounded-2xl border px-3.5 py-2.5',
              field.active ? 'border-primary bg-primary-wash' : 'border-line bg-field',
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

      {/* Scrolls sideways when the labels don't fit, like the filter chips. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="-mx-5 mt-3"
        contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
        {presets.map((preset) => (
          <Chip
            key={preset.label}
            label={preset.label}
            size="sm"
            variant={isPreset(preset.range) ? 'dark' : 'outline'}
            onPress={() => apply(preset.range)}
          />
        ))}
      </ScrollView>

      <View className="mt-4 flex-row items-center justify-between">
        <IconButton
          icon="caret-left"
          iconSize={14}
          accessibilityLabel={t('range.previousMonth')}
          onPress={() => setShown(addDays(month.start, -1))}
        />
        <Text size={16} weight="semibold" className="capitalize">
          {formatMonth(month.start, true)}
        </Text>
        <IconButton
          icon="caret-right"
          iconSize={14}
          accessibilityLabel={t('range.nextMonth')}
          disabled={atThisMonth}
          onPress={() => setShown(month.end)}
        />
      </View>

      <View className="mt-3 flex-row">
        {weekdayInitials().map((label) => (
          <Text key={label} size={12.5} weight="medium" className="flex-1 text-center text-subtle">
            {label}
          </Text>
        ))}
      </View>

      <View className="mt-1">
        {weeks.map((week) => (
          <View key={week[0].getTime()} className="flex-row">
            {week.map((day) => {
              const inMonth = day >= month.start && day < month.end;
              if (!inMonth) return <View key={day.getTime()} className="flex-1" />;
              const future = day > today;
              const isStart = !!from && isSameDay(day, from);
              const isEnd = !!last && isSameDay(day, last);
              const inside = !!from && !!last && day > from && day < last;
              const hasRange = !!from && !!till && !isSameDay(from, till);
              const content = (
                <>
                  {/* The band joins start and end; the ends only fill half. */}
                  {inside || (hasRange && (isStart || isEnd)) ? (
                    <View
                      className="absolute inset-y-[3px] bg-primary-wash"
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
              if (future)
                return (
                  <View
                    key={day.getTime()}
                    className="flex-1 items-center justify-center"
                    style={{ height: CELL_HEIGHT }}>
                    {content}
                  </View>
                );
              return (
                <Pressable
                  key={day.getTime()}
                  haptic="select"
                  accessibilityLabel={formatLongDate(day)}
                  onPress={() => pick(day)}
                  className="flex-1 items-center justify-center"
                  style={{ height: CELL_HEIGHT }}>
                  {content}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>

      <Button
        className="mt-4"
        label={t('common.done')}
        disabled={!from}
        onPress={() => from && onSelect({ start: from, end: addDays(till ?? from, 1) })}
      />
    </>
  );
}

/** From–till picker behind the period pill on Einträge and Check-ins. */
export function DateRangeSheet({ value, onSelect, ...controls }: DateRangeSheetProps) {
  const { t } = useTranslation();
  return (
    <Sheet {...controls} title={t('range.title')}>
      <RangeBody value={value} onSelect={onSelect} />
    </Sheet>
  );
}

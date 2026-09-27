import { useMemo } from 'react';

import { monthNames } from '@/shared/lib/dates';

import { WheelColumn, WheelFrame } from './wheel-picker';

interface DateWheelPickerProps {
  value: Date;
  onChange: (value: Date) => void;
  minYear?: number;
  maxYear?: number;
}

const daysIn = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

// Web: day / month / year wheels; iOS and Android use the native picker. Clamps the day when switching to
// a shorter month so 31 Jan → Feb becomes 28/29 Feb.
export function DateWheelPicker({
  value,
  onChange,
  minYear = 1930,
  maxYear = new Date().getFullYear(),
}: DateWheelPickerProps) {
  const year = value.getFullYear();
  const month = value.getMonth();
  const day = value.getDate();

  const days = useMemo(
    () =>
      Array.from({ length: daysIn(year, month) }, (_, index) => ({
        label: String(index + 1),
        value: index + 1,
      })),
    [year, month],
  );
  const months = useMemo(
    () => monthNames('short').map((label, index) => ({ label, value: index })),
    [],
  );
  const years = useMemo(
    () =>
      Array.from({ length: maxYear - minYear + 1 }, (_, index) => ({
        label: String(minYear + index),
        value: minYear + index,
      })),
    [minYear, maxYear],
  );

  const update = (next: { year?: number; month?: number; day?: number }) => {
    const nextYear = next.year ?? year;
    const nextMonth = next.month ?? month;
    const nextDay = Math.min(next.day ?? day, daysIn(nextYear, nextMonth));
    onChange(new Date(nextYear, nextMonth, nextDay));
  };

  return (
    <WheelFrame tone="date">
      <WheelColumn
        tone="date"
        items={days}
        value={day}
        onChange={(next) => update({ day: next })}
      />
      <WheelColumn
        tone="date"
        items={months}
        value={month}
        onChange={(next) => update({ month: next })}
        className="flex-[1.4]"
      />
      <WheelColumn
        tone="date"
        items={years}
        value={year}
        onChange={(next) => update({ year: next })}
        className="flex-[1.2]"
      />
    </WheelFrame>
  );
}

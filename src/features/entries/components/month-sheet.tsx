import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Sheet, type SheetControls } from '@/shared/components/sheet';
import { WheelColumn, WheelFrame } from '@/shared/components/wheel-picker';
import { monthNames } from '@/shared/lib/dates';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';

const YEARS_BACK = 5;

interface MonthSheetProps extends SheetControls {
  selected: Date;
  onSelect: (month: Date) => void;
}

function MonthWheels({ selected, onSelect }: Pick<MonthSheetProps, 'selected' | 'onSelect'>) {
  const { t } = useTranslation();
  const now = new Date();
  const thisYear = now.getFullYear();
  const [year, setYear] = useState(selected.getFullYear());
  const [month, setMonth] = useState(selected.getMonth());

  const months = useMemo(
    () => monthNames('long').map((label, index) => ({ label, value: index })),
    [],
  );
  const years = useMemo(
    () =>
      Array.from({ length: YEARS_BACK + 1 }, (_, index) => {
        const value = thisYear - YEARS_BACK + index;
        return { label: String(value), value };
      }),
    [thisYear],
  );
  // Future months have no entries yet: stop at this month.
  const clamp = (nextYear: number, nextMonth: number) =>
    nextYear === thisYear ? Math.min(nextMonth, now.getMonth()) : nextMonth;

  return (
    <>
      <WheelFrame tone="date" fadeColor={colors.white} className="mt-4">
        <WheelColumn
          tone="date"
          items={months}
          value={month}
          onChange={(next) => setMonth(clamp(year, next))}
          className="flex-[1.6]"
        />
        <WheelColumn
          tone="date"
          items={years}
          value={year}
          onChange={(next) => {
            setYear(next);
            setMonth(clamp(next, month));
          }}
        />
      </WheelFrame>
      <Button
        className="mt-4"
        label={t('common.done')}
        onPress={() => onSelect(new Date(year, month, 1))}
      />
    </>
  );
}

/** Month and year wheels to browse by month (month pill on Einträge, Check-ins). */
export function MonthSheet({ selected, onSelect, ...controls }: MonthSheetProps) {
  const { t } = useTranslation();
  return (
    <Sheet {...controls} title={t('entries.chooseMonth')} panContent={false}>
      <MonthWheels selected={selected} onSelect={onSelect} />
    </Sheet>
  );
}

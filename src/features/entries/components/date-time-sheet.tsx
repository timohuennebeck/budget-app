import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DateWheelPicker } from '@/shared/components/date-wheel-picker';
import { Sheet, type SheetControls } from '@/shared/components/sheet';
import { TimePicker } from '@/shared/components/time-picker';
import { Button } from '@/shared/ui/button';

interface DateTimeBodyProps {
  value: Date;
  onSave: (value: Date) => void;
}

function DateTimeBody({ value, onSave }: DateTimeBodyProps) {
  const { t } = useTranslation();
  const [date, setDate] = useState(value);
  const [time, setTime] = useState({
    hour: value.getHours(),
    minute: value.getMinutes() - (value.getMinutes() % 5),
  });
  const thisYear = new Date().getFullYear();

  return (
    <>
      <DateWheelPicker value={date} onChange={setDate} minYear={thisYear - 5} maxYear={thisYear} />
      <TimePicker value={time} onChange={setTime} minuteStep={5} />
      <Button
        className="mt-4"
        label={t('common.save')}
        onPress={() => {
          const next = new Date(date);
          next.setHours(time.hour, time.minute, 0, 0);
          onSave(next);
        }}
      />
    </>
  );
}

/** Date and time wheels for an entry's "Datum" row. */
export function DateTimeSheet({ open, onClose, ...body }: DateTimeBodyProps & SheetControls) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onClose={onClose} title={t('entries.date')}>
      <DateTimeBody {...body} />
    </Sheet>
  );
}

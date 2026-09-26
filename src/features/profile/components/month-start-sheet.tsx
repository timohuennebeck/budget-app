import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Sheet, type SheetControls } from '@/shared/components/sheet';
import { WheelColumn, WheelFrame } from '@/shared/components/wheel-picker';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

interface MonthStartBodyProps {
  value: number;
  onSave: (day: number) => void;
}

function MonthStartBody({ value, onSave }: MonthStartBodyProps) {
  const { t } = useTranslation();
  const [day, setDay] = useState(value);
  const days = useMemo(
    () => Array.from({ length: 28 }, (_, index) => ({ label: `${index + 1}.`, value: index + 1 })),
    [],
  );

  return (
    <>
      <Text variant="body" className="mt-3 text-center">
        {t('profile.monthStartHint')}
      </Text>
      <WheelFrame tone="time" fadeColor="#FFFFFF" className="mt-2">
        <WheelColumn tone="time" items={days} value={day} onChange={setDay} />
      </WheelFrame>
      <Button className="mt-4" label={t('common.save')} onPress={() => onSave(day)} />
    </>
  );
}

/** Day of the month the budget resets (Profil › Monatsbeginn). */
export function MonthStartSheet({ open, onClose, ...body }: MonthStartBodyProps & SheetControls) {
  const { t } = useTranslation();
  return (
    <Sheet open={open} onClose={onClose} title={t('profile.monthStart')}>
      <MonthStartBody {...body} />
    </Sheet>
  );
}

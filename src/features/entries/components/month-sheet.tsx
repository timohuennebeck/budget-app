import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Sheet, type SheetControls } from '@/shared/components/sheet';
import { cn } from '@/shared/lib/cn';
import { formatMonth, monthRange } from '@/shared/lib/dates';
import { CheckBadge } from '@/shared/ui/check-badge';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

const MONTHS_BACK = 12;

interface MonthSheetProps extends SheetControls {
  selected: Date;
  onSelect: (month: Date) => void;
}

/** Last twelve months to browse entries by (month pill on Einträge). */
export function MonthSheet({ selected, onSelect, ...controls }: MonthSheetProps) {
  const { t } = useTranslation();
  const now = new Date();
  const months = Array.from(
    { length: MONTHS_BACK },
    (_, index) => new Date(now.getFullYear(), now.getMonth() - index, 1),
  );
  const selectedKey = monthRange(selected).start.getTime();

  return (
    <Sheet {...controls} title={t('entries.chooseMonth')}>
      <View className="mt-4 gap-1">
        {months.map((month) => {
          const active = month.getTime() === selectedKey;
          return (
            <Pressable
              key={month.getTime()}
              haptic="select"
              accessibilityLabel={formatMonth(month, true)}
              onPress={() => onSelect(month)}
              className={cn(
                'flex-row items-center justify-between rounded-2xl px-3.5 py-3',
                active && 'bg-primary-wash',
              )}>
              <Text size={16} weight={active ? 'semibold' : 'regular'} className="capitalize">
                {formatMonth(month, true)}
              </Text>
              {active ? <CheckBadge checked size={20} /> : null}
            </Pressable>
          );
        })}
      </View>
    </Sheet>
  );
}

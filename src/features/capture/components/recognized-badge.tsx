import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';
import { formatMoney } from '@/shared/lib/money';
import { Text } from '@/shared/ui/text';

interface RecognizedBadgeProps {
  count: number;
  total: number;
  currency: string;
  className?: string;
}

export function RecognizedBadge({ count, total, currency, className }: RecognizedBadgeProps) {
  const { t } = useTranslation();
  if (count === 0) return null;
  return (
    <View className={cn('flex-row items-center gap-2.5', className)}>
      <View className="rounded-full bg-primary-tint px-[11px] py-[5px]">
        <Text size={14} weight="semibold" className="text-primary">
          {t('capture.entriesCount', { count })}
        </Text>
      </View>
      <Text size={14} weight="medium" className="text-muted">
        {t('capture.recognized')} ·{' '}
        <Text size={14} weight="semibold">
          {formatMoney(total, { currency, compact: true })}
        </Text>
      </Text>
    </View>
  );
}

import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { huePalette } from '@/shared/lib/color';
import { formatMoney } from '@/shared/lib/money';
import { Text } from '@/shared/ui/text';

import type { SpendSegment } from '../lib/budget-summary';

interface SpendBarProps {
  segments: SpendSegment[];
  spent: number;
  total: number | null;
  currency: string;
}

/** Budget bar split by category colour, with the unspent rest in grey. */
export function SpendBar({ segments, spent, total, currency }: SpendBarProps) {
  const { t } = useTranslation();
  const rest = total === null ? 0 : Math.max(0, total - spent);

  return (
    <View className="mx-1 mt-[34px]">
      <View className="h-2 flex-row gap-[3px]">
        {segments.map((segment) => (
          <View
            key={segment.categoryId}
            className="rounded-full"
            style={{ flex: segment.amount, backgroundColor: huePalette(segment.hue).bar }}
          />
        ))}
        {rest > 0 || segments.length === 0 ? (
          <View className="rounded-full bg-[#E3E9F2]" style={{ flex: rest || 1 }} />
        ) : null}
      </View>
      <View className="mt-[9px] flex-row justify-between">
        <Text size={13} className="text-muted-soft">
          <Text size={13} weight="semibold">
            {formatMoney(spent, { currency })}
          </Text>{' '}
          {t('overview.spent')}
        </Text>
        {total !== null ? (
          <Text size={13} className="text-muted-soft">
            {t('overview.of', { amount: formatMoney(total, { currency, compact: true }) })}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

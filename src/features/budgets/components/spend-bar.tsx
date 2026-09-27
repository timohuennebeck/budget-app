import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { huePalette } from '@/shared/lib/color';
import { formatMoney } from '@/shared/lib/money';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import type { SpendSegment } from '../lib/budget-summary';

interface SpendBarProps {
  segments: SpendSegment[];
  spent: number;
  total: number | null;
  currency: string;
  /** The highlighted category, or null for the whole month */
  selectedId: string | null;
  onSelect: (categoryId: string | null) => void;
}

/**
 * Budget bar split by category colour, with the unspent rest in grey.
 * Tapping a segment picks that category: the others fade and the line
 * below shows what went there; tapping it again shows the total.
 */
export function SpendBar({
  segments,
  spent,
  total,
  currency,
  selectedId,
  onSelect,
}: SpendBarProps) {
  const { t } = useTranslation();
  const selected = segments.find((segment) => segment.categoryId === selectedId);
  const rest = total === null ? 0 : Math.max(0, total - spent);
  const money = (value: number) => formatMoney(value, { currency });

  return (
    <View className="mx-1 mt-6">
      <View className="h-2 flex-row gap-[3px]">
        {segments.map((segment) => (
          <Pressable
            key={segment.categoryId}
            haptic="select"
            accessibilityRole="button"
            accessibilityLabel={segment.name}
            accessibilityState={{ selected: segment === selected }}
            // The bar is 8pt tall; the touch target reaches well beyond it.
            hitSlop={{ top: 16, bottom: 12 }}
            onPress={() => onSelect(segment === selected ? null : segment.categoryId)}
            className="rounded-full"
            style={{
              flex: segment.amount,
              backgroundColor: huePalette(segment.hue).bar,
              opacity: selected && segment !== selected ? 0.25 : 1,
            }}
          />
        ))}
        {rest > 0 || segments.length === 0 ? (
          <View
            className="rounded-full bg-[#E3E9F2]"
            style={{ flex: rest || 1, opacity: selected ? 0.5 : 1 }}
          />
        ) : null}
      </View>
      <View className="mt-[9px] flex-row justify-between">
        {selected ? (
          <>
            <Text size={13} className="text-muted-soft" numberOfLines={1}>
              <Text size={13} weight="semibold">
                {money(selected.amount)}
              </Text>{' '}
              {t('overview.spentOn', { category: selected.name })}
            </Text>
            <Text size={13} className="text-muted-soft">
              {selected.limit !== null
                ? t('overview.of', {
                    amount: formatMoney(selected.limit, { currency, compact: true }),
                  })
                : t('overview.share', { percent: Math.round((selected.amount / spent) * 100) })}
            </Text>
          </>
        ) : (
          <>
            <Text size={13} className="text-muted-soft">
              <Text size={13} weight="semibold">
                {money(spent)}
              </Text>{' '}
              {t('overview.spent')}
            </Text>
            {total !== null ? (
              <Text size={13} className="text-muted-soft">
                {t('overview.of', { amount: formatMoney(total, { currency, compact: true }) })}
              </Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryAvatar } from '@/features/categories/components/category-avatar';
import { huePalette } from '@/shared/lib/color';
import { formatMoney } from '@/shared/lib/money';
import { colors } from '@/shared/lib/theme';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

interface BudgetCardProps {
  name: string;
  icon: string;
  hue: number;
  limit: number;
  remaining: number;
  currency: string;
  width: number;
  onEdit: () => void;
}

/**
 * Compact tile for the 2×2 budget grid: the category, what is left and a
 * bar of what is spent. Turns red once over the limit.
 */
export function BudgetCard({
  name,
  icon,
  hue,
  limit,
  remaining,
  currency,
  width,
  onEdit,
}: BudgetCardProps) {
  const { t } = useTranslation();
  const over = remaining < 0;
  const money = (value: number) => formatMoney(value, { currency, compact: true });
  const spent = limit > 0 ? Math.min(1, Math.max(0, (limit - remaining) / limit)) : 1;
  const status = over
    ? t('budgets.over', { limit: money(limit) })
    : `${money(remaining)} ${t('budgets.freeOf', { limit: money(limit) })}`;

  return (
    // The whole card opens the limit sheet, like the tiles in onboarding.
    <Pressable
      onPress={onEdit}
      accessibilityLabel={`${t('budgets.edit', { name })}, ${status}`}
      className="gap-2.5 rounded-3xl border border-line bg-surface p-3.5"
      style={{ width }}>
      <View className="flex-row items-center gap-2">
        <CategoryAvatar icon={icon} hue={hue} size={28} />
        <Text size={14} weight="semibold" tracking={-0.01} numberOfLines={1} className="flex-1">
          {name}
        </Text>
      </View>
      <Text
        size={20}
        weight="bold"
        tracking={-0.035}
        numberOfLines={1}
        className={over ? 'text-danger-text' : undefined}>
        {money(remaining)}
      </Text>
      <View className="h-1.5 overflow-hidden rounded-full bg-field">
        <View
          className="h-full rounded-full"
          style={{
            width: `${spent * 100}%`,
            backgroundColor: over ? colors.danger : huePalette(hue).foreground,
          }}
        />
      </View>
    </Pressable>
  );
}

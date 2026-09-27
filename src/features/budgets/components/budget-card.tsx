import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryAvatar } from '@/features/categories/components/category-avatar';
import { formatMoney } from '@/shared/lib/money';
import { Icon } from '@/shared/ui/icon';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

interface BudgetCardProps {
  name: string;
  icon: string;
  hue: number;
  limit: number;
  remaining: number;
  currency: string;
  onEdit: () => void;
}

export const BUDGET_CARD_WIDTH = 186;

/** Remaining budget of one category; turns red once over the limit. */
export function BudgetCard({
  name,
  icon,
  hue,
  limit,
  remaining,
  currency,
  onEdit,
}: BudgetCardProps) {
  const { t } = useTranslation();
  const over = remaining < 0;
  const money = (value: number) => formatMoney(value, { currency, compact: true });

  return (
    // The whole card opens the limit sheet, like the tiles in onboarding.
    <Pressable
      onPress={onEdit}
      accessibilityLabel={t('budgets.edit', { name })}
      className="gap-3.5 rounded-3xl border border-line bg-surface p-3.5"
      style={{ width: BUDGET_CARD_WIDTH }}>
      <View className="flex-row items-start justify-between">
        <CategoryAvatar icon={icon} hue={hue} />
        <View className="size-9 items-center justify-center rounded-full bg-field">
          <Icon name="pencil-simple" size={16} />
        </View>
      </View>
      <View className="gap-0.5">
        <Text size={15.5} weight="semibold" tracking={-0.01} numberOfLines={1}>
          {name}
        </Text>
        <Text
          size={22}
          weight="bold"
          tracking={-0.035}
          className={over ? 'text-danger-text' : undefined}>
          {money(remaining)}
        </Text>
        <Text
          size={12.5}
          weight={over ? 'semibold' : 'regular'}
          className={over ? 'text-danger-text' : 'text-subtle'}>
          {over
            ? t('budgets.over', { limit: money(limit) })
            : t('budgets.freeOf', { limit: money(limit) })}
        </Text>
      </View>
    </Pressable>
  );
}

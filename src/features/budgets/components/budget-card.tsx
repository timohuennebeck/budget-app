import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryAvatar } from '@/features/categories/components/category-avatar';
import { formatMoney } from '@/shared/lib/money';
import { IconButton } from '@/shared/ui/icon-button';
import { Text } from '@/shared/ui/text';

interface BudgetCardProps {
  name: string;
  icon: string;
  hue: number;
  limit: number;
  remaining: number;
  currency: string;
  onEdit: () => void;
  /** Blue edit buttons while the sheet is open (2w) */
  highlighted?: boolean;
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
  highlighted,
}: BudgetCardProps) {
  const { t } = useTranslation();
  const over = remaining < 0;
  const money = (value: number) => formatMoney(value, { currency, compact: true });

  return (
    <View
      className="gap-3.5 rounded-3xl border border-line bg-surface p-3.5"
      style={{ width: BUDGET_CARD_WIDTH }}>
      <View className="flex-row items-start justify-between">
        <CategoryAvatar icon={icon} hue={hue} />
        <IconButton
          icon="pencil-simple"
          size={36}
          iconSize={16}
          variant={highlighted ? 'primary' : 'field'}
          accessibilityLabel={t('budgets.edit', { name })}
          onPress={onEdit}
        />
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
    </View>
  );
}

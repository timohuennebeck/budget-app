import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryAvatar } from '@/features/categories/components/category-avatar';
import { cn } from '@/shared/lib/cn';
import { huePalette } from '@/shared/lib/color';
import { formatMoney } from '@/shared/lib/money';
import { Icon } from '@/shared/ui/icon';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import type { BudgetListRow } from '../lib/budget-list';

interface BudgetRowProps extends BudgetListRow {
  currency: string;
  /** Greyed: nothing spent and no limit this month */
  idle?: boolean;
  /** Row tap: the category's month with the trend chart */
  onOpen: () => void;
  /** Pencil tap: the limit sheet */
  onEdit: () => void;
}

/** One category on the Budgets tab: spent this month and how the limit is going. */
export function BudgetRow({
  category,
  spent,
  limit,
  currency,
  idle,
  onOpen,
  onEdit,
}: BudgetRowProps) {
  const { t } = useTranslation();
  const money = (value: number) => formatMoney(value, { currency, compact: true });
  const over = limit !== null && spent > limit;
  const detail =
    limit === null
      ? t('budgets.noLimit')
      : over
        ? `${money(spent - limit)} ${t('budgets.over', { limit: money(limit) })}`
        : `${money(limit - spent)} ${t('budgets.freeOf', { limit: money(limit) })}`;

  return (
    <Pressable
      onPress={onOpen}
      accessibilityLabel={category.name}
      className={cn('flex-row items-center gap-3.5 px-4 py-3', idle && 'opacity-50')}>
      <CategoryAvatar icon={category.icon} hue={category.hue} />
      <View className="min-w-0 flex-1 gap-0.5">
        <View className="flex-row items-baseline justify-between gap-2">
          <Text size={16} weight="semibold" tracking={-0.01} numberOfLines={1} className="shrink">
            {category.name}
          </Text>
          <Text size={16} weight="semibold" tracking={-0.01}>
            {money(spent)}
          </Text>
        </View>
        <Text
          size={13.5}
          weight={over ? 'semibold' : 'regular'}
          numberOfLines={1}
          className={over ? 'text-danger-text' : 'text-subtle'}>
          {detail}
        </Text>
        {limit !== null ? (
          <View className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line-strong">
            <View
              className={cn('h-full rounded-full', over && 'bg-danger')}
              style={{
                width: `${Math.round(Math.min(1, spent / limit) * 100)}%`,
                backgroundColor: over ? undefined : huePalette(category.hue).swatch,
              }}
            />
          </View>
        ) : null}
      </View>
      <Pressable
        onPress={onEdit}
        accessibilityLabel={t('budgets.edit', { name: category.name })}
        hitSlop={8}
        className="size-9 items-center justify-center rounded-full bg-field">
        <Icon name="pencil-simple" size={16} />
      </Pressable>
    </Pressable>
  );
}

import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryAvatar } from '@/features/categories/components/category-avatar';
import { Pressable } from '@/shared/ui/pressable';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

interface BudgetLimitCardProps {
  name: string;
  icon: string;
  hue: number;
  /** Formatted limit or null for "Kein Limit" */
  limitLabel: string | null;
  hint?: string;
  onPress: () => void;
}

/** Grid tile to set a category's monthly limit (2e2). */
export function BudgetLimitCard({
  name,
  icon,
  hue,
  limitLabel,
  hint,
  onPress,
}: BudgetLimitCardProps) {
  const { t } = useTranslation();
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={name}
      className="flex-1 gap-3.5 rounded-[22px] border border-line-card bg-surface p-3.5">
      <View className="flex-row items-start justify-between">
        <CategoryAvatar icon={icon} hue={hue} />
        <View className="size-8 items-center justify-center rounded-full bg-field">
          <Icon name="pencil-simple" size={14} />
        </View>
      </View>
      <View className="gap-0.5">
        <Text size={15.5} weight="semibold" tracking={-0.01} numberOfLines={1}>
          {name}
        </Text>
        <Text size={22} weight="bold" tracking={-0.035}>
          {limitLabel ?? t('budgets.noLimit')}
        </Text>
        {hint ? (
          <Text size={12.5} className="text-subtle">
            {hint}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

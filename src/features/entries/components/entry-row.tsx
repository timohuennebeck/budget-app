import type { ReactNode } from 'react';
import { View } from 'react-native';

import { CategoryAvatar } from '@/features/categories/components/category-avatar';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

export interface EntryRowProps {
  icon: string;
  hue: number;
  title: string;
  subtitle: ReactNode;
  amount: string;
  /** Replaces the plain amount, e.g. a coloured pill */
  trailing?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
  compact?: boolean;
  className?: string;
}

// The one list row used for entries everywhere: Start, Einträge, review,
// check-in, calendar sheet and saved screens.
export function EntryRow({
  icon,
  hue,
  title,
  subtitle,
  amount,
  trailing,
  onPress,
  chevron,
  compact,
  className,
}: EntryRowProps) {
  const content = (
    <View
      className={cn(
        'flex-row items-center',
        compact ? 'gap-3 py-2' : 'gap-3.5 px-4 py-2.5',
        className,
      )}>
      <CategoryAvatar icon={icon} hue={hue} size={compact ? 38 : 42} />
      <View className="min-w-0 flex-1 gap-0.5">
        <Text size={compact ? 15 : 16} weight="semibold" tracking={-0.01} numberOfLines={1}>
          {title}
        </Text>
        {typeof subtitle === 'string' ? (
          <Text size={compact ? 12.5 : 13.5} className="text-subtle" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : (
          subtitle
        )}
      </View>
      {trailing ?? (
        <Text size={compact ? 15 : 16} weight="semibold" tracking={-0.01}>
          {amount}
        </Text>
      )}
      {chevron ? <Icon name="caret-right" size={13} color={colors.chevron} /> : null}
    </View>
  );

  if (!onPress) return content;
  return (
    <Pressable onPress={onPress} accessibilityLabel={`${title} ${amount}`}>
      {content}
    </Pressable>
  );
}

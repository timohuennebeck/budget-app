import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/lib/theme';

import { Icon, type IconName } from './icon';
import { Pressable } from './pressable';
import { Text } from './text';

type Variant = 'outline' | 'selected' | 'soft' | 'tint' | 'dark';
type Size = 'sm' | 'md' | 'lg';

export interface ChipProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  trailingIcon?: IconName;
  /** Grow to share the row with sibling chips; the label never wraps */
  fill?: boolean;
}

const containers: Record<Variant, string> = {
  outline: 'bg-surface border border-line-strong',
  selected: 'bg-primary',
  soft: 'bg-field',
  tint: 'bg-primary-tint',
  dark: 'bg-ink',
};

const labels: Record<Variant, string> = {
  outline: 'text-ink-soft',
  selected: 'text-white',
  soft: 'text-ink-soft',
  tint: 'text-primary',
  dark: 'text-white',
};

const heights: Record<Size, string> = { sm: 'h-9 px-3.5', md: 'h-10 px-4', lg: 'h-11 px-4' };
const textSizes: Record<Size, number> = { sm: 14.5, md: 15, lg: 15.5 };

export function Chip({
  label,
  onPress,
  variant = 'outline',
  size = 'md',
  trailingIcon,
  fill,
}: ChipProps) {
  const strong = variant === 'selected' || variant === 'dark';
  const content = (
    <View className="flex-row items-center gap-2">
      <Text
        numberOfLines={1}
        size={textSizes[size]}
        weight={strong ? 'semibold' : 'medium'}
        className={labels[variant]}>
        {label}
      </Text>
      {trailingIcon ? (
        <Icon name={trailingIcon} size={12} color={strong ? colors.white : colors.inkSoft} />
      ) : null}
    </View>
  );
  const classes = cn(
    'items-center justify-center rounded-full',
    heights[size],
    fill && 'grow',
    containers[variant],
  );

  if (!onPress) return <View className={classes}>{content}</View>;
  return (
    <Pressable haptic="select" onPress={onPress} accessibilityLabel={label} className={classes}>
      {content}
    </Pressable>
  );
}

import { ActivityIndicator, View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/lib/theme';

import { Icon, type IconName } from './icon';
import { Pressable, type HapticKind } from './pressable';
import { Text } from './text';

type Variant = 'primary' | 'danger' | 'ghost' | 'ghost-danger' | 'link' | 'outline';
type Size = 'lg' | 'md' | 'sm';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: IconName;
  disabled?: boolean;
  loading?: boolean;
  haptic?: HapticKind;
  className?: string;
}

const container: Record<Variant, string> = {
  primary: 'bg-primary',
  danger: 'bg-danger',
  outline: 'bg-surface border border-line-strong',
  ghost: '',
  'ghost-danger': '',
  link: '',
};

const heights: Record<Size, string> = {
  lg: 'h-[60px] px-6',
  md: 'h-11 px-5',
  sm: 'h-10 px-[18px]',
};

const labelColor: Record<Variant, string> = {
  primary: 'text-white',
  danger: 'text-white',
  outline: 'text-ink-soft',
  ghost: 'text-ink-soft',
  'ghost-danger': 'text-danger-text',
  link: 'text-primary',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'lg',
  icon,
  disabled,
  loading,
  haptic = variant === 'primary' || variant === 'danger' ? 'press' : 'tap',
  className,
}: ButtonProps) {
  const filled = variant === 'primary' || variant === 'danger';
  // Large text-only buttons sit under a primary action as a plain text line,
  // like the design; the hit slop keeps the touch target at full size.
  const textOnly = size === 'lg' && (variant === 'ghost' || variant === 'ghost-danger');
  const textSize = size === 'lg' ? (filled ? 17.5 : 16) : size === 'md' ? 15.5 : 15;

  return (
    <Pressable
      haptic={haptic}
      disabled={disabled || loading}
      onPress={onPress}
      accessibilityLabel={label}
      hitSlop={textOnly ? 15 : undefined}
      className={cn(
        'flex-row items-center justify-center gap-2 rounded-full',
        textOnly ? 'h-[30px] px-6' : heights[size],
        container[variant],
        className,
      )}>
      {loading ? (
        <ActivityIndicator color={filled ? colors.white : colors.primary} />
      ) : (
        <View className="flex-row items-center gap-1.5">
          {icon ? (
            <Icon name={icon} size={16} color={filled ? colors.white : colors.inkSoft} />
          ) : null}
          <Text
            size={textSize}
            weight={filled || variant === 'link' ? 'semibold' : 'medium'}
            className={labelColor[variant]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

import { cn } from '@/shared/lib/cn';
import { colors, shadows } from '@/shared/lib/theme';

import { Icon, type IconName } from './icon';
import { Pressable, type HapticKind } from './pressable';

type Variant = 'field' | 'surface' | 'soft' | 'primary' | 'glass' | 'translucent';

export interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  variant?: Variant;
  /** Diameter in px */
  size?: number;
  iconSize?: number;
  accessibilityLabel: string;
  haptic?: HapticKind;
  disabled?: boolean;
  className?: string;
}

const backgrounds: Record<Variant, string> = {
  field: 'bg-field',
  surface: 'bg-surface',
  soft: 'bg-primary-soft',
  primary: 'bg-primary',
  glass: 'bg-white/15',
  translucent: 'bg-white/75',
};

const iconColors: Record<Variant, string> = {
  field: colors.icon,
  surface: colors.inkSoft,
  soft: colors.primary,
  primary: colors.white,
  glass: colors.white,
  translucent: colors.icon,
};

export function IconButton({
  icon,
  onPress,
  variant = 'field',
  size = 34,
  iconSize,
  accessibilityLabel,
  haptic,
  disabled,
  className,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      haptic={haptic}
      disabled={disabled}
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      className={cn('items-center justify-center rounded-full', backgrounds[variant], className)}
      style={[{ width: size, height: size }, variant === 'surface' && shadows.card]}>
      <Icon name={icon} size={iconSize ?? Math.round(size * 0.42)} color={iconColors[variant]} />
    </Pressable>
  );
}

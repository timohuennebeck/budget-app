import { Pressable as RNPressable, type PressableProps as RNPressableProps } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { haptics } from '@/shared/lib/haptics';

export type HapticKind = keyof typeof haptics | 'none';

export interface PressableProps extends RNPressableProps {
  haptic?: HapticKind;
  className?: string;
}

// Every tappable element goes through here so presses get consistent
// haptic feedback and a subtle pressed state.
export function Pressable({
  haptic = 'tap',
  onPress,
  className,
  disabled,
  ...props
}: PressableProps) {
  return (
    <RNPressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={(event) => {
        if (haptic !== 'none') haptics[haptic]();
        onPress?.(event);
      }}
      className={cn('active:opacity-70', disabled && 'opacity-50', className)}
      {...props}
    />
  );
}

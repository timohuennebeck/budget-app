import { Pressable as RNPressable, type PressableProps as RNPressableProps } from 'react-native';

import { useClickSounds } from '@/shared/lib/click-sounds';
import { cn } from '@/shared/lib/cn';
import { haptics } from '@/shared/lib/haptics';
import { playSound } from '@/shared/lib/sounds';

export type HapticKind = keyof typeof haptics | 'none';

export interface PressableProps extends RNPressableProps {
  haptic?: HapticKind;
  className?: string;
}

// Every tappable element goes through here so presses get consistent
// haptic feedback and a subtle pressed state. In onboarding, presses that
// give haptic feedback also click.
export function Pressable({
  haptic = 'tap',
  onPress,
  className,
  disabled,
  ...props
}: PressableProps) {
  const clickSounds = useClickSounds();
  return (
    <RNPressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={(event) => {
        if (haptic !== 'none') {
          haptics[haptic]();
          if (clickSounds) playSound('click');
        }
        onPress?.(event);
      }}
      className={cn('active:opacity-70', disabled && 'opacity-50', className)}
      {...props}
    />
  );
}

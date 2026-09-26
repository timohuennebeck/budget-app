import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/lib/theme';

import { Icon } from './icon';

interface CheckBadgeProps {
  checked: boolean;
  size?: number;
  className?: string;
}

/** Filled blue check when selected, empty ring otherwise. */
export function CheckBadge({ checked, size = 24, className }: CheckBadgeProps) {
  return (
    <View
      className={cn(
        'items-center justify-center rounded-full',
        checked ? 'bg-primary' : 'border-2 border-[#C9D5E8] bg-surface',
        className,
      )}
      style={{ width: size, height: size }}>
      {checked ? <Icon name="check" size={Math.round(size * 0.5)} color={colors.white} /> : null}
    </View>
  );
}

/** iOS-style radio: thick blue ring when selected. */
export function RadioMark({ checked }: { checked: boolean }) {
  return (
    <View
      className={cn(
        'size-[22px] rounded-full bg-surface',
        checked ? 'border-[7px] border-primary' : 'border-2 border-dot',
      )}
    />
  );
}

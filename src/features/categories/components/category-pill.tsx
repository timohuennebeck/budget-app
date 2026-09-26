import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { huePalette } from '@/shared/lib/color';
import { Text } from '@/shared/ui/text';

interface CategoryPillProps {
  label: string;
  hue: number;
  size?: 'sm' | 'md';
  className?: string;
}

/** Coloured pill carrying the category colour, e.g. "Essen gehen" or "−40 €". */
export function CategoryPill({ label, hue, size = 'sm', className }: CategoryPillProps) {
  const palette = huePalette(hue);
  return (
    <View
      className={cn('rounded-full', size === 'sm' ? 'px-[9px] py-[3px]' : 'px-2.5 py-1', className)}
      style={{ backgroundColor: palette.background }}>
      <Text size={size === 'sm' ? 12.5 : 13} weight="semibold" style={{ color: palette.pillText }}>
        {label}
      </Text>
    </View>
  );
}

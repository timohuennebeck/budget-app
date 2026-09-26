import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { CheckBadge } from '@/shared/ui/check-badge';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

interface OptionRowProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  selected: boolean;
  onPress: () => void;
}

/** Selectable card row (language, currency): blue ring and check when chosen. */
export function OptionRow({ title, subtitle, leading, selected, onPress }: OptionRowProps) {
  return (
    <Pressable
      haptic="select"
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      className={cn(
        'flex-row items-center gap-3.5 rounded-[20px] bg-surface px-3.5 py-3',
        selected ? 'border-2 border-primary' : 'border border-line',
      )}>
      {leading}
      <View className="flex-1 gap-px">
        <Text size={subtitle ? 16.5 : 17} weight={selected || subtitle ? 'semibold' : 'medium'}>
          {title}
        </Text>
        {subtitle ? (
          <Text size={13.5} className="text-subtle">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {selected ? <CheckBadge checked /> : null}
    </Pressable>
  );
}

import type { ReactNode } from 'react';
import { View } from 'react-native';

import { CheckBadge } from '@/shared/ui/check-badge';
import { Pressable } from '@/shared/ui/pressable';
import { SelectionRing } from '@/shared/ui/selection-ring';
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
      className="flex-row items-center gap-3.5 rounded-[20px] border border-line bg-surface px-3.5 py-3">
      <SelectionRing visible={selected} className="rounded-[20px]" />
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

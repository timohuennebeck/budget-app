import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function SectionHeader({ title, actionLabel, onAction, className }: SectionHeaderProps) {
  return (
    <View className={cn('flex-row items-baseline justify-between px-1', className)}>
      <Text variant="section">{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} accessibilityLabel={actionLabel}>
          <Text size={14.5} weight="medium" className="text-primary">
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

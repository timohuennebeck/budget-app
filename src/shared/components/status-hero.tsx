import type { ReactNode } from 'react';
import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { Pip, type PipPose } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

interface StatusHeroProps {
  pose?: PipPose;
  pipSize?: number;
  title: string;
  subtitle?: ReactNode;
  /** e.g. `max-w-none` for a subtitle that spans the screen */
  subtitleClassName?: string;
  className?: string;
}

/** Centered Pip + title + subtitle block for success, empty and error states. */
export function StatusHero({
  pose,
  pipSize = 160,
  title,
  subtitle,
  subtitleClassName,
  className,
}: StatusHeroProps) {
  return (
    <View className={cn('items-center', className)}>
      {pose ? <Pip pose={pose} size={pipSize} /> : null}
      <Text variant="title" size={31} className={cn('text-center', pose && 'mt-[22px]')}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" className={cn('mt-3 max-w-[300px] text-center', subtitleClassName)}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

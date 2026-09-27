import type { ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';
import { Card } from '@/shared/ui/card';
import { Pip, type PipPose } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

interface EmptyCardProps {
  pose: PipPose;
  title: string;
  subtitle: string;
  /** Below the subtitle, e.g. example chips */
  children?: ReactNode;
  className?: string;
}

/** Empty state as a card with Pip: first run on Start, no check-ins, an empty chart. */
export function EmptyCard({ pose, title, subtitle, children, className }: EmptyCardProps) {
  return (
    <Card className={cn('items-center rounded-[28px] px-5 pt-[22px] pb-6', className)}>
      <Pip pose={pose} size={120} />
      <Text variant="heading" className="mt-3 text-center">
        {title}
      </Text>
      <Text size={15} leading={1.45} className="mt-2 max-w-[280px] text-center text-muted-soft">
        {subtitle}
      </Text>
      {children}
    </Card>
  );
}

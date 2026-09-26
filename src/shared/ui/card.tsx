import { View, type ViewProps } from 'react-native';

import { cn } from '@/shared/lib/cn';

export interface CardProps extends ViewProps {
  /** `outlined` uses the stronger 2px blue ring for selected states */
  tone?: 'default' | 'selected' | 'plain';
}

export function Card({ tone = 'default', className, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-3xl bg-surface',
        tone === 'default' && 'border border-line',
        tone === 'selected' && 'border-2 border-primary',
        className,
      )}
      {...props}
    />
  );
}

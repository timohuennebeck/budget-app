import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';

interface ProgressBarProps {
  /** 0…1 */
  value: number;
  className?: string;
}

export function ProgressBar({ value, className }: ProgressBarProps) {
  const percent = `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` as const;
  return (
    <View className={cn('h-1.5 overflow-hidden rounded-full bg-line-strong', className)}>
      <View className="h-full rounded-full bg-primary" style={{ width: percent }} />
    </View>
  );
}

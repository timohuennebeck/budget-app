import { View, type ViewProps } from 'react-native';

import { cn } from '@/shared/lib/cn';

export function Card({ className, ...props }: ViewProps) {
  return <View className={cn('rounded-3xl border border-line bg-surface', className)} {...props} />;
}

import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';

export function PageDots({ count, active }: { count: number; active: number }) {
  return (
    <View className="flex-row gap-[5px]">
      {Array.from({ length: count }, (_, index) => (
        <View
          key={index}
          className={cn('h-1.5 rounded-full', index === active ? 'w-4 bg-primary' : 'w-1.5 bg-dot')}
        />
      ))}
    </View>
  );
}

import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

interface StepIntroProps {
  title: string;
  subtitle?: string;
  className?: string;
}

/** Large question + helper line used at the top of flow steps. */
export function StepIntro({ title, subtitle, className }: StepIntroProps) {
  return (
    <View className={cn('mt-[22px]', className)}>
      <Text variant="display" leading={1.08}>
        {title}
      </Text>
      {subtitle ? (
        <Text variant="body" className="mt-2.5">
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

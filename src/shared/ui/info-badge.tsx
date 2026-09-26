import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { Text } from '@/shared/ui/text';

type Variant = 'soft' | 'solid';

const variants: Record<Variant, { container: string; text: string; size: number }> = {
  soft: { container: 'size-5 bg-primary-soft', text: 'text-primary', size: 12 },
  solid: { container: 'size-[22px] bg-primary', text: 'text-white', size: 14 },
};

/** Round "i" marker in front of an explanatory note. */
export function InfoBadge({ variant = 'soft' }: { variant?: Variant }) {
  const style = variants[variant];
  return (
    <View className={cn('mt-px items-center justify-center rounded-full', style.container)}>
      <Text size={style.size} weight="semibold" className={style.text}>
        i
      </Text>
    </View>
  );
}

import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { CategoryAvatar } from '@/features/categories/components/category-avatar';
import { shadows } from '@/shared/lib/theme';
import { Text } from '@/shared/ui/text';

interface FloatingEntryCardProps {
  icon: string;
  hue: number;
  title: string;
  subtitle: string;
  amount: string;
  /** Resting tilt in degrees; the card tilts the other way at the top */
  tilt: number;
  duration: number;
  delay: number;
  position: { top: number; left?: number; right?: number };
}

// Example entry that bobs up and down on the welcome screen (tallyFloat).
export function FloatingEntryCard({
  icon,
  hue,
  title,
  subtitle,
  amount,
  tilt,
  duration,
  delay,
  position,
}: FloatingEntryCardProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [delay, duration, progress]);

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: -8 * progress.value },
      { rotate: `${tilt * (1 - 2 * progress.value)}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[{ position: 'absolute', ...position }, shadows.floating, animated]}
      className="flex-row items-center gap-3 rounded-[20px] border border-line-strong bg-surface py-2.5 pr-4 pl-2.5">
      <CategoryAvatar icon={icon} hue={hue} size={40} />
      <View className="gap-px">
        <Text size={15.5} weight="semibold">
          {title}
        </Text>
        <Text size={13} className="text-subtle">
          {subtitle}
        </Text>
      </View>
      <Text size={15.5} weight="semibold" className="ml-3.5">
        {amount}
      </Text>
    </Animated.View>
  );
}

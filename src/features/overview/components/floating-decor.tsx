import { Image, type ImageSourcePropType } from 'react-native';
import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

interface FloatingDecorProps {
  source: ImageSourcePropType;
  size: number;
  /** Resting tilt in degrees; it sways to the opposite tilt and back */
  tilt: number;
  /** How far it drifts up, in px */
  lift: number;
  duration: number;
  delay: number;
  position: { top?: number; bottom?: number; left?: number; right?: number };
}

/** A small sticker (star, coin) that drifts and sways beside Pip on Start. */
export function FloatingDecor({
  source,
  size,
  tilt,
  lift,
  duration,
  delay,
  position,
}: FloatingDecorProps) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.value = withDelay(
      delay,
      withRepeat(
        withTiming(1, { duration: duration / 2, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      ),
    );
  }, [delay, duration, progress, reduceMotion]);

  const animated = useAnimatedStyle(() => ({
    transform: [
      { translateY: -lift * progress.value },
      { rotate: `${tilt * (1 - 2 * progress.value)}deg` },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', width: size, height: size }, position, animated]}>
      <Image source={source} style={{ width: size, height: size }} />
    </Animated.View>
  );
}

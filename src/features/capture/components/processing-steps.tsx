import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

type StepState = 'done' | 'active' | 'pending';

const labelColors: Record<StepState, string> = {
  done: 'text-ink',
  active: 'text-muted-soft',
  pending: 'text-faint',
};

function Spinner() {
  const rotation = useSharedValue(0);
  useEffect(() => {
    rotation.value = withRepeat(withTiming(360, { duration: 800, easing: Easing.linear }), -1);
    return () => cancelAnimation(rotation);
  }, [rotation]);
  const style = useAnimatedStyle(() => ({ transform: [{ rotate: `${rotation.value}deg` }] }));
  return (
    <Animated.View
      style={[
        {
          width: 26,
          height: 26,
          borderRadius: 13,
          borderWidth: 2.5,
          borderColor: colors.primarySoft,
          borderTopColor: colors.primary,
        },
        style,
      ]}
    />
  );
}

function StepMark({ state }: { state: StepState }) {
  if (state === 'done') {
    return (
      <View className="size-[26px] items-center justify-center rounded-full bg-primary">
        <Icon name="check" size={13} color={colors.white} />
      </View>
    );
  }
  if (state === 'active') return <Spinner />;
  return <View className="size-[26px] rounded-full border-[1.5px] border-[#D5DBE5]" />;
}

/** Checklist under the ring: done ✓, working spinner, pending circle. */
export function ProcessingSteps({ steps }: { steps: { label: string; state: StepState }[] }) {
  return (
    <View className="gap-[13px] self-stretch px-1.5">
      {steps.map((step) => (
        <View key={step.label} className="flex-row items-center gap-3">
          <StepMark state={step.state} />
          <Text size={17} leading={1.35} className={labelColors[step.state]}>
            {step.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

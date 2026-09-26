import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { type NativeScrollEvent, type NativeSyntheticEvent, ScrollView, View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { haptics } from '@/shared/lib/haptics';
import { colors } from '@/shared/lib/theme';
import { Text } from '@/shared/ui/text';

export interface WheelItem<T> {
  label: string;
  value: T;
}

type Tone = 'time' | 'date';

interface WheelColumnProps<T> {
  items: WheelItem<T>[];
  value: T;
  onChange: (value: T) => void;
  tone: Tone;
  align?: 'start' | 'center' | 'end';
  className?: string;
}

const VISIBLE = 5;
const metrics = {
  time: { itemHeight: 46, size: 27, activeSize: 27 },
  date: { itemHeight: 44, size: 19, activeSize: 22 },
};

function styleFor(tone: Tone, distance: number) {
  if (distance === 0) return { className: 'text-ink', weight: 'semibold' as const, opacity: 1 };
  if (tone === 'time')
    return {
      className: 'text-ink',
      weight: 'regular' as const,
      opacity: distance === 1 ? 0.4 : 0.16,
    };
  return {
    className: distance === 1 ? 'text-faint' : 'text-grabber',
    weight: 'regular' as const,
    opacity: 1,
  };
}

// One scrollable column of an iOS-style wheel. Items snap to the centre row
// and fire a selection haptic whenever the centred value changes.
export function WheelColumn<T>({
  items,
  value,
  onChange,
  tone,
  align = 'center',
  className,
}: WheelColumnProps<T>) {
  const { itemHeight, size, activeSize } = metrics[tone];
  const scroll = useRef<ScrollView>(null);
  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.value === value),
  );
  // While the user drags, the row under the band wins; otherwise the value.
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const centered = dragIndex ?? selectedIndex;

  useEffect(() => {
    scroll.current?.scrollTo({ y: selectedIndex * itemHeight, animated: false });
  }, [selectedIndex, itemHeight]);

  const indexFrom = (event: NativeSyntheticEvent<NativeScrollEvent>) =>
    Math.min(
      items.length - 1,
      Math.max(0, Math.round(event.nativeEvent.contentOffset.y / itemHeight)),
    );

  return (
    <ScrollView
      ref={scroll}
      className={cn('flex-1', className)}
      style={{ height: itemHeight * VISIBLE }}
      contentContainerStyle={{ paddingVertical: itemHeight * 2 }}
      showsVerticalScrollIndicator={false}
      snapToInterval={itemHeight}
      decelerationRate="fast"
      scrollEventThrottle={16}
      nestedScrollEnabled
      onScroll={(event) => {
        const index = indexFrom(event);
        if (index !== centered) {
          haptics.select();
          setDragIndex(index);
        }
      }}
      onMomentumScrollEnd={(event) => {
        const item = items[indexFrom(event)];
        if (item && item.value !== value) onChange(item.value);
        setDragIndex(null);
      }}>
      {items.map((item, index) => {
        const style = styleFor(tone, Math.abs(index - centered));
        return (
          <View
            key={String(item.value)}
            style={{ height: itemHeight }}
            className={cn(
              'justify-center px-2',
              align === 'start' && 'items-start',
              align === 'center' && 'items-center',
              align === 'end' && 'items-end',
            )}>
            <Text
              size={index === centered ? activeSize : size}
              weight={style.weight}
              className={style.className}
              style={{ opacity: style.opacity, fontVariant: ['tabular-nums'] }}>
              {item.label}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

interface WheelFrameProps {
  tone: Tone;
  children: ReactNode;
  /** Colour the top/bottom fades blend into */
  fadeColor?: string;
  className?: string;
}

/** Highlight band plus top/bottom fades shared by all wheel pickers. */
export function WheelFrame({
  tone,
  children,
  fadeColor = colors.canvas,
  className,
}: WheelFrameProps) {
  const { itemHeight } = metrics[tone];
  const height = itemHeight * VISIBLE;
  return (
    <View className={cn('relative overflow-hidden', className)} style={{ height }}>
      <View
        className={cn(
          'absolute inset-x-0 rounded-[14px]',
          tone === 'time' ? 'bg-primary-tint' : 'bg-primary-wash',
        )}
        style={{ top: itemHeight * 2, height: itemHeight }}
      />
      <View className="flex-1 flex-row">{children}</View>
      {tone === 'time' ? (
        <>
          <LinearGradient
            pointerEvents="none"
            colors={[fadeColor, `${fadeColor}00`]}
            locations={[0.2, 1]}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 64 }}
          />
          <LinearGradient
            pointerEvents="none"
            colors={[`${fadeColor}00`, fadeColor]}
            locations={[0, 0.8]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 64 }}
          />
        </>
      ) : null}
    </View>
  );
}

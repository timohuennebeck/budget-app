import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/shared/lib/theme';

const STROKE_WIDTH = 10;

interface ProgressRingProps {
  size: number;
  /** 0…1 */
  progress: number;
  trackColor?: string;
  children?: ReactNode;
}

/** Circular progress around Pip (processing 2j, limit 3f). */
export function ProgressRing({
  size,
  progress,
  trackColor = colors.primarySoft,
  children,
}: ProgressRingProps) {
  const radius = (size - STROKE_WIDTH) / 2 - 3;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <View className="items-center justify-center" style={{ width: size, height: size }}>
      <Svg
        width={size}
        height={size}
        style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={STROKE_WIDTH}
        />
        {clamped > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={colors.primary}
            strokeWidth={STROKE_WIDTH}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped)}
          />
        ) : null}
      </Svg>
      {children}
    </View>
  );
}

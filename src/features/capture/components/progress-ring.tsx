import type { ReactNode } from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { colors } from '@/shared/lib/theme';

interface ProgressRingProps {
  size: number;
  /** 0…1 */
  progress: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  children?: ReactNode;
}

/** Circular progress around Pip (processing 2j, limit 3f). */
export function ProgressRing({
  size,
  progress,
  strokeWidth = 10,
  color = colors.primary,
  trackColor = colors.primarySoft,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2 - 3;
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
          strokeWidth={strokeWidth}
        />
        {clamped > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
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

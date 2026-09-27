import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { huePalette } from '@/shared/lib/color';
import { colors } from '@/shared/lib/theme';
import { Text } from '@/shared/ui/text';

import type { CategoryTrend } from '../lib/category-trend';

interface TrendChartProps {
  trend: CategoryTrend;
  hue: number;
  ticks: { index: number; label: string }[];
}

const HEIGHT = 190;
const PAD_TOP = 14;
const PAD_RIGHT = 10;
const GRID_LINES = 3;

/**
 * Running total through the cycle (solid, with a soft fill), the even pace
 * to the limit (dashed), where today's pace ends up (dotted) and today as a
 * ring (2w-e).
 */
export function TrendChart({ trend, hue, ticks }: TrendChartProps) {
  const [width, setWidth] = useState(0);
  const color = huePalette(hue).foreground;
  const { days, cumulative, limit, projected } = trend;

  const top = Math.max(limit ?? 0, projected, trend.spent, 1) * 1.08;
  const plotWidth = Math.max(1, width - PAD_RIGHT);
  // Day i ends at x(i + 1): the line starts at 0 before the first day.
  const x = (day: number) => (day / days) * plotWidth;
  const y = (amount: number) => PAD_TOP + (1 - amount / top) * (HEIGHT - PAD_TOP);

  const points = [[x(0), y(0)], ...cumulative.map((amount, index) => [x(index + 1), y(amount)])];
  const line = points.map(([px, py], index) => `${index ? 'L' : 'M'}${px},${py}`).join(' ');
  const [lastX, lastY] = points[points.length - 1];
  const area = `${line} L${lastX},${HEIGHT} L${x(0)},${HEIGHT} Z`;

  return (
    <View>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={{ height: HEIGHT }}>
        {width > 0 ? (
          <Svg width={width} height={HEIGHT}>
            <Defs>
              <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.16} />
                <Stop offset="1" stopColor={color} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {Array.from({ length: GRID_LINES }, (_, index) => {
              const gy = PAD_TOP + ((index + 0.3) / GRID_LINES) * (HEIGHT - PAD_TOP);
              return (
                <Line
                  key={index}
                  x1={0}
                  x2={plotWidth}
                  y1={gy}
                  y2={gy}
                  stroke={colors.line}
                  strokeWidth={1}
                />
              );
            })}
            {limit !== null ? (
              <Line
                x1={x(0)}
                y1={y(0)}
                x2={x(days)}
                y2={y(limit)}
                stroke={colors.faint}
                strokeWidth={1.5}
                strokeDasharray="5 5"
              />
            ) : null}
            <Path d={area} fill="url(#fill)" />
            {trend.daysLeft > 0 ? (
              <Line
                x1={lastX}
                y1={lastY}
                x2={x(days)}
                y2={y(projected)}
                stroke={color}
                strokeWidth={2.5}
                strokeDasharray="1 6"
                strokeLinecap="round"
              />
            ) : null}
            <Path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth={3}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            <Circle
              cx={lastX}
              cy={lastY}
              r={7}
              fill={colors.white}
              stroke={color}
              strokeWidth={3}
            />
          </Svg>
        ) : null}
      </View>
      <View className="mt-2 h-4">
        {ticks.map((tick) => (
          <Text
            key={tick.index}
            size={12.5}
            className="absolute text-subtle"
            style={{ left: x(tick.index + 0.5) - 12, width: 24, textAlign: 'center' }}>
            {tick.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

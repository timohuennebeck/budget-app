import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from 'react-native-svg';

import { huePalette } from '@/shared/lib/color';
import { haptics } from '@/shared/lib/haptics';
import { colors } from '@/shared/lib/theme';
import { Text } from '@/shared/ui/text';

import type { CategoryTrend } from '../lib/category-trend';

interface TrendChartProps {
  trend: CategoryTrend;
  hue: number;
  ticks: { index: number; label: string }[];
  /** Day index (0 = first day of the cycle) while held, null on release */
  onScrub?: (day: number | null) => void;
}

const HEIGHT = 190;
const PAD_TOP = 14;
// Room below zero so a flat line at 0 draws in full, not half cut off.
const PAD_BOTTOM = 4;
const PAD_RIGHT = 10;
// Half the line width, so its rounded start isn't cut off at the edge.
const PAD_LEFT = 2;
// The today ring (r 7 + half its stroke) can sit on the zero line: the
// drawing reaches this far below the plot, into the gap above the labels.
const OVERHANG = 9;
const LABEL_GAP = 8;
const GRID_LINES = 3;
const HOLD_MS = 180;

type Point = [number, number];

/**
 * Smooth path through the points that never overshoots them (monotone
 * cubic, Fritsch–Carlson), so a running total never appears to dip.
 */
function smoothPath(points: Point[]) {
  const n = points.length;
  if (n < 2) return n ? `M${points[0][0]},${points[0][1]}` : '';
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    slopes.push((points[i + 1][1] - points[i][1]) / (points[i + 1][0] - points[i][0]));
  }
  const tangents = points.map((_, i) => {
    if (i === 0) return slopes[0];
    if (i === n - 1) return slopes[n - 2];
    const [a, b] = [slopes[i - 1], slopes[i]];
    return a * b <= 0 ? 0 : (2 * a * b) / (a + b);
  });
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const third = (x1 - x0) / 3;
    d += ` C${x0 + third},${y0 + tangents[i] * third} ${x1 - third},${y1 - tangents[i + 1] * third} ${x1},${y1}`;
  }
  return d;
}

/**
 * Running total through the cycle (solid, with a soft fill), the even pace
 * to the limit (dashed), where today's pace ends up (dotted) and today as a
 * ring (2w-e). Press and hold, then slide, to read any day so far.
 */
export function TrendChart({ trend, hue, ticks, onScrub }: TrendChartProps) {
  const [width, setWidth] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const color = huePalette(hue).foreground;
  const { days, elapsed, cumulative, limit, projected } = trend;

  const top = Math.max(limit ?? 0, projected, trend.spent, 1) * 1.08;
  const plotWidth = Math.max(1, width - PAD_LEFT - PAD_RIGHT);
  // Day i ends at x(i + 1): the line starts at 0 before the first day.
  const x = (day: number) => PAD_LEFT + (day / days) * plotWidth;
  const y = (amount: number) => PAD_TOP + (1 - amount / top) * (HEIGHT - PAD_TOP - PAD_BOTTOM);

  const points: Point[] = [
    [x(0), y(0)],
    ...cumulative.map((amount, index): Point => [x(index + 1), y(amount)]),
  ];
  const line = smoothPath(points);
  const [lastX, lastY] = points[points.length - 1];
  const area = `${line} L${lastX},${HEIGHT} L${x(0)},${HEIGHT} Z`;

  const update = (touchX: number | null) =>
    setScrub(
      touchX === null
        ? null
        : Math.min(
            elapsed - 1,
            Math.max(0, Math.ceil(((touchX - PAD_LEFT) / plotWidth) * days) - 1),
          ),
    );

  // A tick for every new day under the finger, like a stock chart.
  useEffect(() => {
    if (scrub !== null) haptics.select();
    onScrub?.(scrub);
  }, [scrub, onScrub]);

  // Scrolling stays with the page; only a press held in place starts reading.
  const gesture = Gesture.Pan()
    .activateAfterLongPress(HOLD_MS)
    .runOnJS(true)
    .onStart((event) => update(event.x))
    .onUpdate((event) => update(event.x))
    .onFinalize(() => update(null));

  const marker: Point | null = scrub === null ? null : [x(scrub + 1), y(cumulative[scrub])];

  return (
    <View>
      <GestureDetector gesture={gesture}>
        <View
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          style={{ height: HEIGHT + OVERHANG }}>
          {width > 0 ? (
            <Svg width={width} height={HEIGHT + OVERHANG}>
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
                    x1={x(0)}
                    x2={x(days)}
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
              {marker ? (
                <>
                  <Line
                    x1={marker[0]}
                    x2={marker[0]}
                    y1={0}
                    y2={HEIGHT}
                    stroke={colors.chevron}
                    strokeWidth={1.5}
                  />
                  <Circle cx={marker[0]} cy={marker[1]} r={6} fill={color} />
                </>
              ) : (
                <Circle
                  cx={lastX}
                  cy={lastY}
                  r={7}
                  fill={colors.white}
                  stroke={color}
                  strokeWidth={3}
                />
              )}
            </Svg>
          ) : null}
        </View>
      </GestureDetector>
      <View className="h-4" style={{ marginTop: LABEL_GAP - OVERHANG }}>
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

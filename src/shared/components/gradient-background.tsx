import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';

import { gradients } from '@/shared/lib/theme';

export type GradientName = 'sky' | 'mist';

/** Soft blue wash that fades into the canvas colour behind a screen. */
export function GradientBackground({ name, height }: { name: GradientName; height?: number }) {
  const colors = name === 'sky' ? gradients.sky : gradients.mist;
  const locations = name === 'sky' ? gradients.skyStops : gradients.mistStops;
  return (
    <LinearGradient
      pointerEvents="none"
      colors={colors}
      locations={locations}
      style={[StyleSheet.absoluteFill, height ? { height, bottom: undefined } : null]}
    />
  );
}

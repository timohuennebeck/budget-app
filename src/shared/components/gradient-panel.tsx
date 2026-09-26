import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { gradients } from '@/shared/lib/theme';

interface GradientPanelProps {
  children: ReactNode;
  /** Layout of the panel; margin and radius can be overridden */
  style?: StyleProp<ViewStyle>;
}

/** Rounded light-blue panel behind Pip and illustrations in flow steps. */
export function GradientPanel({ children, style }: GradientPanelProps) {
  return (
    <LinearGradient colors={gradients.panel} style={[{ marginTop: 22, borderRadius: 28 }, style]}>
      {children}
    </LinearGradient>
  );
}

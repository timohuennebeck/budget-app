import { Platform } from 'react-native';

/**
 * Props for a tab's full-screen ScrollView so it scrolls behind the status
 * bar and the native tab bar. The native tabs only inset the ScrollView they
 * reach through each view's first child, which misses screens that start
 * with a background, so the tab asks for automatic insets itself. They cover
 * the status bar too; Android pads the tab above the bar and leaves the top
 * to us.
 */
export function tabScrollProps(safeTop: number, extraTop = 0) {
  return {
    contentInsetAdjustmentBehavior: 'automatic' as const,
    paddingTop: (Platform.OS === 'ios' ? 0 : safeTop) + extraTop,
  };
}

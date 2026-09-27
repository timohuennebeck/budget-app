import { Platform } from 'react-native';

/**
 * Props for a tab's full-screen ScrollView, scrolling behind the status bar
 * and native tab bar. Native tabs only inset a ScrollView that is the first
 * child, missing screens that start with a background, so it asks for
 * automatic insets itself (status bar included). Android pads the tab above
 * the bar and leaves the top to us.
 */
export function tabScrollProps(safeTop: number, extraTop = 0) {
  return {
    contentInsetAdjustmentBehavior: 'automatic' as const,
    paddingTop: (Platform.OS === 'ios' ? 0 : safeTop) + extraTop,
  };
}

/**
 * For tabs with a fixed header above a scrolling list: the header clears
 * the status bar itself, and the list (not the first child any more) asks
 * for automatic insets so it ends above the native tab bar.
 */
export function tabListProps(safeTop: number, extraTop = 0) {
  return {
    headerPaddingTop: safeTop + extraTop,
    contentInsetAdjustmentBehavior: 'automatic' as const,
  };
}

import { Platform } from 'react-native';

// Breathing room between the status bar and a tab's first row.
const EXTRA_TOP = 4;

/**
 * Props for a tab's full-screen ScrollView behind the status bar and native
 * tab bar. Native tabs only inset a first-child ScrollView, so it asks for
 * automatic insets itself; Android pads above the bar and leaves the top to us.
 */
export function tabScrollProps(safeTop: number) {
  return {
    contentInsetAdjustmentBehavior: 'automatic' as const,
    paddingTop: (Platform.OS === 'ios' ? 0 : safeTop) + EXTRA_TOP,
  };
}

/**
 * For tabs with a fixed header above a scrolling list: the header clears
 * the status bar itself, and the list (not the first child any more) asks
 * for automatic insets so it ends above the native tab bar.
 */
export function tabListProps(safeTop: number) {
  return {
    headerPaddingTop: safeTop + EXTRA_TOP,
    contentInsetAdjustmentBehavior: 'automatic' as const,
  };
}

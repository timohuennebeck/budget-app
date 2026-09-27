import { Platform } from 'react-native';

/**
 * Top padding for a tab's full-screen ScrollView. On iOS the native tabs
 * give that ScrollView automatic content insets, which already include the
 * status bar; Android leaves the top to us.
 */
export function tabScrollTop(safeTop: number, extra = 0) {
  return (Platform.OS === 'ios' ? 0 : safeTop) + extra;
}

import type { ReactNode } from 'react';
import { SafeAreaView } from 'react-native-screens/experimental';

import { colors } from '@/shared/lib/theme';

/**
 * Root of every tab. The tabs set disableAutomaticContentInsets, so this is
 * the one place that keeps content, floating bars included, above the
 * native tab bar (its inset on iOS and Android; a plain View on web).
 */
export function TabScreen({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView edges={{ bottom: true }} style={{ flex: 1, backgroundColor: colors.canvas }}>
      {children}
    </SafeAreaView>
  );
}

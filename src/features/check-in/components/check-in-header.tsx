import { router } from 'expo-router';
import { View } from 'react-native';

import { ScreenHeader } from '@/shared/components/screen-header';
import { formatWeekRange } from '@/shared/lib/dates';
import { shadows } from '@/shared/lib/theme';
import { Text } from '@/shared/ui/text';

import type { CheckInWindow } from '../lib/check-in-window';

/** × plus the week range pill shared by the check-in screens. */
export function CheckInHeader({ window }: { window: CheckInWindow }) {
  return (
    <ScreenHeader leading="close" onLeadingPress={() => router.dismissAll()}>
      <View className="flex-1 items-center">
        <View className="rounded-full bg-surface px-3.5 py-2" style={shadows.card}>
          <Text size={14.5} weight="semibold" tracking={-0.01}>
            {formatWeekRange(window.week)}
          </Text>
        </View>
      </View>
    </ScreenHeader>
  );
}

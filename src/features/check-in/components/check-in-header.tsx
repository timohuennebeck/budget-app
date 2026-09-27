import { router } from 'expo-router';
import { View } from 'react-native';

import { ScreenHeader } from '@/shared/components/screen-header';
import { type DateRange, formatWeekRange } from '@/shared/lib/dates';
import { shadows } from '@/shared/lib/theme';
import { Text } from '@/shared/ui/text';

/** × plus the week range pill shared by the check-in screens. */
export function CheckInHeader({ week }: { week: DateRange }) {
  return (
    // The empty trailing slot mirrors the × so the week pill sits centred.
    <ScreenHeader leading="close" onLeadingPress={() => router.dismissAll()} trailing={<View />}>
      <View className="flex-1 items-center">
        <View className="rounded-full bg-surface px-3.5 py-2" style={shadows.card}>
          <Text size={14.5} weight="semibold" tracking={-0.01}>
            {formatWeekRange(week)}
          </Text>
        </View>
      </View>
    </ScreenHeader>
  );
}

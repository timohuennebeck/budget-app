import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Platform, View } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';
import { useTranslation } from 'react-i18next';

import { useEntriesAllowance } from '@/features/paywall/hooks/use-entries-allowance';
import { colors, shadows } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { IconButton } from '@/shared/ui/icon-button';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

const DockInset = Platform.OS === 'ios' ? SafeAreaView : View;

// Floating capture bar at the bottom of Start: text field look-alike that
// opens the capture flow, plus camera and microphone shortcuts.
export function CaptureDock({ firstName }: { firstName: string }) {
  const { t } = useTranslation();
  const allowance = useEntriesAllowance();
  const open = (path: '/capture' | '/capture/camera' | '/capture/voice') =>
    router.push(allowance.canAdd() ? path : '/limit');

  return (
    // On iOS the dock sits above the tab bar via its own safe area (the tab's
    // ScrollView is inset natively); Android already pads the tab.
    <DockInset
      edges={{ bottom: true }}
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flex: 0 }}
      pointerEvents="box-none">
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(247,249,252,0)', colors.canvas]}
        locations={[0, 0.55]}
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 130 }}
      />
      <View className="flex-row gap-2.5 px-4 pb-4">
        <Pressable
          onPress={() => open('/capture')}
          accessibilityLabel={t('capture.title', { name: firstName })}
          className="h-[60px] min-w-0 flex-1 flex-row items-center gap-2.5 rounded-full border border-line-strong bg-surface px-2"
          style={shadows.floating}>
          <View className="size-11 items-center justify-center rounded-full bg-primary">
            <Icon name="plus" size={22} color="#FFFFFF" weight="bold" />
          </View>
          <Text size={16} weight="medium" className="flex-1 text-subtle" numberOfLines={1}>
            {t('capture.titleInline', { name: firstName })}
          </Text>
        </Pressable>
        <IconButton
          icon="camera"
          variant="soft"
          size={60}
          iconSize={24}
          accessibilityLabel={t('capture.camera')}
          onPress={() => open('/capture/camera')}
        />
        <View className="rounded-full" style={shadows.primary}>
          <IconButton
            icon="microphone"
            variant="primary"
            size={60}
            iconSize={24}
            haptic="press"
            accessibilityLabel={t('capture.voice')}
            onPress={() => open('/capture/voice')}
          />
        </View>
      </View>
    </DockInset>
  );
}

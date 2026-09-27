import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useEntriesAllowance } from '@/features/paywall/hooks/use-entries-allowance';
import { cn } from '@/shared/lib/cn';
import { colors, shadows } from '@/shared/lib/theme';
import { Icon, type IconName } from '@/shared/ui/icon';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

type CapturePath = '/capture' | '/capture/camera' | '/capture/voice';

type ActionLabel = 'overview.actionEntry' | 'overview.actionPhoto' | 'overview.actionVoice';

const ACTIONS: { path: CapturePath; icon: IconName; label: ActionLabel; primary?: boolean }[] = [
  { path: '/capture', icon: 'plus', label: 'overview.actionEntry', primary: true },
  { path: '/capture/camera', icon: 'camera', label: 'overview.actionPhoto' },
  { path: '/capture/voice', icon: 'microphone', label: 'overview.actionVoice' },
];

/** Eintrag, Foto and Sprache under the headline number on Start (2l-b). */
export function CaptureActions() {
  const { t } = useTranslation();
  const allowance = useEntriesAllowance();
  return (
    <View className="mt-7 flex-row justify-center gap-11">
      {ACTIONS.map(({ path, icon, label, primary }) => (
        <Pressable
          key={path}
          haptic="press"
          accessibilityRole="button"
          accessibilityLabel={t(label)}
          onPress={() => router.push(allowance.canAdd() ? path : '/limit')}
          className="items-center gap-2">
          <View
            className={cn(
              'size-[58px] items-center justify-center rounded-full',
              primary ? 'bg-primary' : 'bg-surface',
            )}
            style={primary ? shadows.primary : shadows.card}>
            <Icon
              name={icon}
              weight={primary ? 'bold' : 'regular'}
              size={24}
              color={primary ? colors.white : colors.primary}
            />
          </View>
          <Text size={14} weight="medium" className="text-ink-soft">
            {t(label)}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { colors, shadows } from '@/shared/lib/theme';
import { Text } from '@/shared/ui/text';

interface NotificationCardProps {
  time: string;
  title: string;
  body: string;
  faded?: boolean;
}

function NotificationCard({ time, title, body, faded }: NotificationCardProps) {
  return (
    <View
      className="flex-row items-start gap-3 rounded-[22px] px-3.5 py-3"
      style={[
        { backgroundColor: faded ? 'rgba(255,255,255,0.8)' : colors.white },
        shadows.floating,
      ]}>
      <Image
        source={require('@/assets/images/app-icon-small.png')}
        style={{ width: 38, height: 38, borderRadius: 10 }}
      />
      <View className="min-w-0 flex-1">
        <View className="flex-row justify-between">
          <Text size={12.5} tracking={0.06} className="text-ink-soft">
            LOOOP
          </Text>
          <Text size={12.5} className="text-subtle">
            {time}
          </Text>
        </View>
        <Text size={15.5} weight="semibold" className="mt-[3px]">
          {title}
        </Text>
        <Text size={14.5} leading={1.35} className="mt-px text-ink-soft">
          {body}
        </Text>
      </View>
    </View>
  );
}

/** Stack of example notifications shown on the permission step (2p). */
export function NotificationPreview() {
  const { t } = useTranslation();
  return (
    <View className="relative mb-[22px]">
      <View
        className="absolute inset-0 rounded-[22px] bg-white/60"
        style={{ transform: [{ translateY: 22 }, { scale: 0.88 }] }}
      />
      <View
        className="absolute inset-0"
        style={{ transform: [{ translateY: 12 }, { scale: 0.94 }] }}>
        <NotificationCard
          faded
          time="9:00"
          title={t('onboarding.notifications.exampleTitle2')}
          body={t('onboarding.notifications.exampleBody2')}
        />
      </View>
      <NotificationCard
        time={t('onboarding.notifications.now')}
        title={t('onboarding.notifications.exampleTitle')}
        body={t('onboarding.notifications.exampleBody')}
      />
    </View>
  );
}

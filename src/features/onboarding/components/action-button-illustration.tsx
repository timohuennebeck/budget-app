import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryPill } from '@/features/categories/components/category-pill';
import { colors, gradients } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

/** iPhone edge with a highlighted Action Button and a live capture (2p2). */
export function ActionButtonIllustration() {
  const { t } = useTranslation();
  return (
    <LinearGradient
      colors={gradients.panel}
      style={{ marginTop: 22, height: 250, borderRadius: 28, overflow: 'hidden' }}>
      <View
        className="absolute rounded-[44px] bg-surface"
        style={{
          left: 92,
          top: 34,
          width: 240,
          height: 300,
          borderWidth: 7,
          borderColor: colors.ink,
        }}
      />
      <View
        className="absolute rounded-[3px] bg-primary"
        style={{
          left: 79,
          top: 92,
          width: 6,
          height: 34,
          shadowColor: colors.primary,
          shadowOpacity: 0.35,
          shadowRadius: 8,
        }}
      />
      <View
        className="absolute rounded-[3px] bg-[#3B3F48]"
        style={{ left: 80, top: 146, width: 5, height: 44 }}
      />
      <View
        className="absolute rounded-[3px] bg-[#3B3F48]"
        style={{ left: 80, top: 198, width: 5, height: 44 }}
      />
      <View className="absolute rounded-full bg-primary px-2 py-1" style={{ left: 16, top: 98 }}>
        <Text size={11.5} weight="semibold" className="text-white">
          {t('onboarding.actionButton.action')}
        </Text>
      </View>
      <View
        className="absolute flex-row items-center gap-2 rounded-full bg-ink py-2 pr-2.5 pl-2"
        style={{ left: 112, top: 62, right: 90 }}>
        <Image
          source={require('@/assets/images/app-icon-small.png')}
          style={{ width: 26, height: 26, borderRadius: 13 }}
        />
        <Text size={13} weight="semibold" className="flex-1 text-white">
          {t('onboarding.actionButton.listening')}
        </Text>
        <Icon name="microphone" weight="fill" size={15} color={colors.primary} />
      </View>
      <Text
        size={17}
        weight="medium"
        leading={1.35}
        className="absolute"
        style={{ left: 124, top: 128, right: 104 }}>
        „12 € Uber“
      </Text>
      <View className="absolute" style={{ left: 124, top: 166 }}>
        <CategoryPill label={`12 € · ${t('categories.transport')}`} hue={255} />
      </View>
    </LinearGradient>
  );
}

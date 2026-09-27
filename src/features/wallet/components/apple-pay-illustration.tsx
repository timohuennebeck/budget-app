import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryPill } from '@/features/categories/components/category-pill';
import { GradientPanel } from '@/shared/components/gradient-panel';
import { colors, shadows } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

/** An Apple Pay payment turning into a sorted Looop entry, drawn on the
 * same iPhone as the Action Button illustration. */
export function ApplePayIllustration() {
  const { t } = useTranslation();
  return (
    <GradientPanel style={{ height: 250, overflow: 'hidden' }}>
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
        className="absolute flex-row items-center gap-1 rounded-full bg-ink px-2.5 py-1"
        style={{ left: 8, top: 74 }}>
        <Icon name="credit-card" weight="fill" size={13} color="#FFFFFF" />
        <Text size={11.5} weight="semibold" className="text-white">
          Apple Pay
        </Text>
      </View>

      {/* The Wallet notification after paying */}
      <View
        className="absolute flex-row items-center gap-2.5 rounded-[18px] bg-surface py-2 pr-3 pl-2"
        style={{ left: 108, top: 56, right: 52, ...shadows.floating }}>
        <View className="size-[30px] items-center justify-center rounded-[8px] bg-ink">
          <Icon name="credit-card" weight="fill" size={16} color="#FFFFFF" />
        </View>
        <View className="min-w-0 flex-1">
          <Text size={11} weight="semibold" className="text-muted-soft">
            Wallet
          </Text>
          <Text size={13.5} weight="semibold" numberOfLines={1}>
            REWE · 12,40 €
          </Text>
        </View>
      </View>

      <View className="absolute items-center" style={{ left: 108, right: 52, top: 112 }}>
        <Icon name="caret-down" size={18} color={colors.primary} />
      </View>

      {/* Looop noting it in the background */}
      <View
        className="absolute flex-row items-center gap-2 rounded-full bg-ink py-2 pr-3 pl-2"
        style={{ left: 108, top: 138, right: 52 }}>
        <Image
          source={require('@/assets/images/app-icon-small.png')}
          style={{ width: 26, height: 26, borderRadius: 13 }}
        />
        <Text size={13} weight="semibold" className="flex-1 text-white" numberOfLines={1}>
          {t('wallet.noted')}
        </Text>
        <Icon name="check" size={15} color={colors.primary} />
      </View>
      <View className="absolute" style={{ left: 120, top: 190 }}>
        <CategoryPill label={`12,40 € · ${t('categories.groceries')}`} hue={150} />
      </View>
    </GradientPanel>
  );
}

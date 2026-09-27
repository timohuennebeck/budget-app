import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryPill } from '@/features/categories/components/category-pill';
import { GradientPanel } from '@/shared/components/gradient-panel';
import { colors } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

/** iPhone with Apple Pay open, the side button pressed twice and the entry
 * Looop made of it (2p5-b). Mirrors the Action Button illustration. */
export function ApplePayIllustration() {
  const { t } = useTranslation();
  return (
    <GradientPanel style={{ height: 250, overflow: 'hidden' }}>
      <View
        className="absolute rounded-[44px] bg-surface"
        style={{
          left: 26,
          top: 30,
          width: 240,
          height: 300,
          borderWidth: 7,
          borderColor: colors.ink,
        }}
      />
      {/* The side button sits flush against the frame's right edge (266). */}
      <View
        className="absolute rounded-[3px] bg-primary"
        style={{
          left: 266,
          top: 88,
          width: 6,
          height: 58,
          boxShadow: '0 0 0 5px rgba(47,124,246,0.22), 0 0 0 12px rgba(47,124,246,0.12)',
        }}
      />
      <View className="absolute rounded-full bg-primary px-2 py-1" style={{ left: 292, top: 104 }}>
        <Text size={11.5} weight="semibold" className="text-white">
          2×
        </Text>
      </View>

      <View
        className="absolute justify-between rounded-[16px] bg-ink px-4 py-3.5"
        style={{ left: 48, top: 56, width: 196, height: 118 }}>
        <View className="flex-row items-center gap-1">
          <Icon name="apple-logo" weight="fill" size={17} color="#FFFFFF" />
          <Text size={16} weight="semibold" className="text-white">
            Pay
          </Text>
        </View>
        <Text size={12} className="text-white/70">
          •••• 4821
        </Text>
      </View>
      <View className="absolute" style={{ left: 48, top: 188 }}>
        <CategoryPill label={`4,80 € · ${t('categories.restaurants')}`} hue={55} />
      </View>
    </GradientPanel>
  );
}

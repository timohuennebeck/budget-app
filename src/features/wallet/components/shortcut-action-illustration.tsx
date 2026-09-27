import { Image } from 'expo-image';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GradientPanel } from '@/shared/components/gradient-panel';
import { colors, shadows } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

/** The "Zahlung erfassen" block as Shortcuts shows it once both fields are
 * linked to the payment. */
export function ShortcutActionIllustration() {
  const { t } = useTranslation();
  const field = (label: string, value: string) => (
    <View className="flex-row items-center justify-between gap-3 py-2.5">
      <Text size={14} className="text-ink-soft">
        {label}
      </Text>
      <View className="flex-row items-center gap-1 rounded-[8px] bg-primary-soft px-2 py-1">
        <Icon name="credit-card" weight="fill" size={12} color={colors.primary} />
        <Text size={12.5} weight="semibold" className="text-primary" numberOfLines={1}>
          {`${t('wallet.shortcutInput')} › ${value}`}
        </Text>
      </View>
    </View>
  );
  return (
    <GradientPanel style={{ paddingVertical: 34, paddingHorizontal: 18 }}>
      <View className="rounded-[18px] bg-surface px-4 pt-3.5 pb-1.5" style={shadows.floating}>
        <View className="flex-row items-center gap-2.5 pb-2.5">
          <Image
            source={require('@/assets/images/app-icon-small.png')}
            style={{ width: 28, height: 28, borderRadius: 7 }}
          />
          <Text size={15} weight="semibold" className="flex-1" numberOfLines={1}>
            {t('wallet.actionName')}
          </Text>
          <Icon name="caret-up" size={16} color={colors.faint} />
        </View>
        <View className="h-px bg-line" />
        {field(t('wallet.amount'), t('wallet.amount'))}
        <View className="h-px bg-line" />
        {field(t('wallet.merchant'), t('wallet.merchant'))}
      </View>
    </GradientPanel>
  );
}

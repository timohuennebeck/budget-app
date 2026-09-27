import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GradientPanel } from '@/shared/components/gradient-panel';
import { shadows } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { PipAvatar } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

/** An Apple Pay card with the Looop notification that follows a payment (2p4). */
export function ApplePayCardIllustration() {
  const { t } = useTranslation();
  return (
    <GradientPanel style={{ paddingTop: 30, paddingBottom: 38, alignItems: 'center' }}>
      <View
        className="justify-between rounded-[18px] bg-ink px-5 pt-4"
        // The notification covers the bottom 40pt; the number row sits above it.
        style={{ width: '72%', aspectRatio: 1.62, maxWidth: 290, paddingBottom: 54 }}>
        <View className="flex-row items-center gap-1">
          <Icon name="apple-logo" weight="fill" size={20} color="#FFFFFF" />
          <Text size={19} weight="semibold" className="text-white">
            Pay
          </Text>
        </View>
        <View className="flex-row items-center justify-between">
          <Text size={13} className="text-white/70">
            •••• 4821
          </Text>
          <Icon name="contactless-payment" size={20} color="rgba(255,255,255,0.7)" />
        </View>
      </View>

      {/* The notification, stacked on two fainter ones */}
      <View className="-mt-10 w-[92%]">
        <View className="absolute inset-x-5 -bottom-4 h-10 rounded-[20px] bg-surface/50" />
        <View className="absolute inset-x-2.5 -bottom-2 h-10 rounded-[20px] bg-surface/80" />
        <View
          className="flex-row items-center gap-3 rounded-[20px] bg-surface px-3.5 py-3"
          style={shadows.floating}>
          <PipAvatar size={44} />
          <View className="min-w-0 flex-1 gap-0.5">
            <View className="flex-row items-center justify-between">
              <Text size={11.5} weight="medium" tracking={0.06} className="text-muted-soft">
                LOOOP
              </Text>
              <Text size={11.5} className="text-muted-soft">
                {t('onboarding.applePay.now')}
              </Text>
            </View>
            <Text size={15} weight="semibold">
              {t('onboarding.applePay.captured', { amount: '4,80 €' })}
            </Text>
            <Text size={13.5} className="text-ink-soft" numberOfLines={1}>
              {`Bäckerei Kamps · ${t('categories.cafe')}`}
            </Text>
          </View>
        </View>
      </View>
    </GradientPanel>
  );
}

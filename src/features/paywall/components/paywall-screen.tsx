import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';
import { CheckBadge } from '@/shared/ui/check-badge';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

import { useRestorePurchases, useStartTrial } from '../hooks/use-purchase';
import { type PlanId, PLUS_CURRENCY } from '../lib/purchases';
import { PlanOptions } from './plan-options';

const FEATURES = [
  'paywall.featureUnlimited',
  'paywall.featureHistory',
  'paywall.featureExport',
] as const;

/** Looop Plus paywall (2g). `onClose` runs after dismissing or subscribing. */
export function PaywallScreen({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { plusPricing, freeEntries } = useAppConfig();
  const [plan, setPlan] = useState<PlanId>('yearly');
  const trial = useStartTrial();
  const restore = useRestorePurchases();

  return (
    <Screen
      scroll
      className="bg-[#F4F7FD]"
      footer={
        <View>
          <Button
            label={t('paywall.startTrial', { days: plusPricing.trialDays })}
            loading={trial.isPending}
            onPress={() => trial.mutate(plan, { onSuccess: onClose })}
          />
          <Text size={13.5} leading={1.45} className="mt-[11px] text-center text-hint">
            {t('paywall.disclaimer', {
              amount: formatMoney(plusPricing.yearly, { currency: PLUS_CURRENCY }),
            })}
          </Text>
          <Button
            variant="link"
            size="md"
            label={t('paywall.restore')}
            loading={restore.isPending}
            onPress={() => restore.mutate()}
          />
        </View>
      }>
      <ScreenHeader leading="close" onLeadingPress={onClose} />
      <Pip pose="basic" size={104} style={{ alignSelf: 'center', marginTop: 10 }} />
      <View className="mt-5 flex-row items-center gap-2">
        <Text size={16} weight="semibold" className="text-ink-soft">
          Looop
        </Text>
        <View className="rounded-full bg-primary px-[11px] py-1">
          <Text size={14} weight="semibold" className="text-white">
            Plus
          </Text>
        </View>
      </View>
      <Text variant="title" className="mt-2.5">
        {t('paywall.titleStart')}
        <Text variant="title" className="bg-primary-mark">
          {` ${t('paywall.titleHighlight')} `}
        </Text>
        {t('paywall.titleEnd')}
      </Text>
      <Text size={15} leading={1.42} className="mt-[9px] text-muted-soft">
        {t('paywall.free', { count: freeEntries })}
      </Text>
      <View className="mt-4 gap-[11px]">
        {FEATURES.map((key) => (
          <View key={key} className="flex-row items-center gap-[11px]">
            <CheckBadge checked size={23} />
            <Text size={15}>{t(key)}</Text>
          </View>
        ))}
      </View>
      <View className="mt-[22px]">
        <PlanOptions selected={plan} onSelect={setPlan} />
      </View>
    </Screen>
  );
}

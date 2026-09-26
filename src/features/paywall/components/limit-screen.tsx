import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ProgressRing } from '@/features/capture/components/progress-ring';
import { useProfile } from '@/features/profile/hooks/use-profile';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { budgetCycle, daysBetween, formatMonth } from '@/shared/lib/dates';
import { Button } from '@/shared/ui/button';
import { InfoBadge } from '@/shared/ui/info-badge';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

import { useEntryAllowance } from '../hooks/use-entry-allowance';
import { useStartTrial } from '../hooks/use-purchase';
import type { PlanId } from '../lib/purchases';
import { PlanOptions } from './plan-options';

/** Free entries used up (3f): empty ring, reset date and plan choice. */
export function LimitScreen() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const { plusPricing } = useAppConfig();
  const allowance = useEntryAllowance();
  const trial = useStartTrial();
  const [plan, setPlan] = useState<PlanId>('yearly');

  const cycle = budgetCycle(new Date(), profile?.month_start_day ?? 1);
  const days = daysBetween(new Date(), cycle.end);

  return (
    <Screen
      gradient="sky"
      gradientHeight={380}
      footer={
        <View>
          <Button
            label={t('paywall.startTrial', { days: plusPricing.trialDays })}
            loading={trial.isPending}
            onPress={() => trial.mutate(plan, { onSuccess: () => router.back() })}
          />
          <Button
            variant="ghost"
            className="mt-2.5"
            label={t('limit.wait', { month: formatMonth(cycle.end) })}
            onPress={() => router.back()}
          />
        </View>
      }>
      <View className="items-center pb-[22px]">
        <ScreenHeader
          leading="close"
          translucent
          title={t('limit.header')}
          className="self-stretch"
        />
        <View className="mt-1">
          <ProgressRing size={230} progress={0} trackColor="rgba(255,255,255,0.85)">
            <Pip pose="boxing" size={146} />
          </ProgressRing>
          <View className="absolute -bottom-0.5 self-center rounded-full bg-primary px-3.5 py-1.5">
            <Text size={14} weight="semibold" className="text-white">
              {t('limit.counter', { remaining: allowance.remaining, total: allowance.limit })}
            </Text>
          </View>
        </View>
      </View>
      <Text variant="title" className="mt-5 text-center">
        {t('limit.title')}
      </Text>
      <Text size={15} className="mt-2.5 text-center text-muted-soft">
        {t('limit.resets', { count: days, limit: allowance.limit })}
      </Text>
      <View className="mt-6">
        <PlanOptions selected={plan} onSelect={setPlan} />
      </View>
      <View className="mt-4 flex-row items-start gap-2.5 px-1">
        <InfoBadge />
        <Text size={14} leading={1.45} className="flex-1 text-muted-soft">
          {t('limit.keepEntries')}
        </Text>
      </View>
    </Screen>
  );
}

import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAppConfig } from '@/shared/hooks/use-app-config';
import { formatMoney, roundMoney } from '@/shared/lib/money';
import { CheckBadge } from '@/shared/ui/check-badge';
import { Pressable } from '@/shared/ui/pressable';
import { SelectionRing } from '@/shared/ui/selection-ring';
import { Text } from '@/shared/ui/text';

import { type PlanId, PLUS_CURRENCY } from '../lib/purchases';

interface PlanCardProps {
  title: string;
  price: string;
  note: string;
  badge?: string;
  selected: boolean;
  onPress: () => void;
}

function PlanCard({ title, price, note, badge, selected, onPress }: PlanCardProps) {
  const { t } = useTranslation();
  return (
    <Pressable
      haptic="select"
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      className="flex-1 gap-0.5 rounded-[22px] border border-line-card bg-surface p-4">
      <SelectionRing visible={selected} className="rounded-[22px]" />
      {badge ? (
        <View className="absolute -top-[11px] left-3.5 h-[22px] justify-center rounded-full bg-primary px-2.5">
          <Text size={11.5} weight="semibold" className="text-white">
            {badge}
          </Text>
        </View>
      ) : null}
      <View className="flex-row items-start justify-between">
        <Text size={15.5} weight="semibold">
          {title}
        </Text>
        <CheckBadge checked={selected} size={23} />
      </View>
      <Text size={21} weight="semibold" tracking={-0.02} className="mt-[22px]">
        {price}
      </Text>
      <Text size={14} className="text-hint">
        {t('paywall.perMonth')}
      </Text>
      <Text size={13} className="mt-1 text-muted-soft">
        {note}
      </Text>
    </Pressable>
  );
}

interface PlanOptionsProps {
  selected: PlanId;
  onSelect: (plan: PlanId) => void;
}

/** Monthly vs. yearly plan cards (paywall 2g and limit screen 3f). */
export function PlanOptions({ selected, onSelect }: PlanOptionsProps) {
  const { t } = useTranslation();
  const { plusPricing } = useAppConfig();
  const currency = PLUS_CURRENCY;
  const yearlyMonthly = roundMoney(plusPricing.yearly / 12);
  const saving = Math.floor((1 - yearlyMonthly / plusPricing.monthly) * 100);

  return (
    <View className="flex-row gap-3">
      <PlanCard
        title={t('paywall.monthly')}
        price={formatMoney(plusPricing.monthly, { currency })}
        note={t('paywall.monthlyNote')}
        selected={selected === 'monthly'}
        onPress={() => onSelect('monthly')}
      />
      <PlanCard
        title={t('paywall.yearly')}
        price={formatMoney(yearlyMonthly, { currency })}
        note={t('paywall.yearlyNote', { amount: formatMoney(plusPricing.yearly, { currency }) })}
        badge={t('paywall.save', { percent: saving })}
        selected={selected === 'yearly'}
        onPress={() => onSelect('yearly')}
      />
    </View>
  );
}

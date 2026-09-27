import { View } from 'react-native';

import { MoneyText } from '@/shared/components/money-text';
import { shadows } from '@/shared/lib/theme';
import { Text } from '@/shared/ui/text';

interface AvailableHeroProps {
  label: string;
  amount: number;
  currency: string;
  /** Bold part of the pill, e.g. "Ø 74 € pro Tag" */
  highlight: string;
  /** Muted rest of the pill, e.g. "· im September" */
  detail: string;
}

/** "Frei verfügbar" headline number with the daily hint below. */
export function AvailableHero({ label, amount, currency, highlight, detail }: AvailableHeroProps) {
  return (
    <View className="mt-[34px] items-center">
      <Text size={14.5} weight="medium" className="text-muted">
        {label}
      </Text>
      <MoneyText amount={amount} currency={currency} className="mt-1.5" />
      <View
        className="mt-3 flex-row items-center gap-1.5 rounded-full bg-surface px-3.5 py-[7px]"
        style={shadows.card}>
        <Text size={14} weight="semibold">
          {highlight}
        </Text>
        <Text size={14} weight="medium" className="text-muted">
          {detail}
        </Text>
      </View>
    </View>
  );
}

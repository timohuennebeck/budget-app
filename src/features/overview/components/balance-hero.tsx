import { View } from 'react-native';

import { MoneyText } from '@/shared/components/money-text';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

interface BalanceHeroProps {
  label: string;
  amount: number;
  currency: string;
  /** Over budget: red number and a dizzy Pip */
  over: boolean;
}

/** What's left this month, left-aligned with Pip beside it (2l-i). */
export function BalanceHero({ label, amount, currency, over }: BalanceHeroProps) {
  return (
    <View className="mt-7 flex-row items-center justify-between gap-2 px-1">
      <View className="min-w-0 flex-1">
        <Text size={15} weight="medium" className="text-muted">
          {label}
        </Text>
        <MoneyText amount={amount} currency={currency} danger={over} className="mt-3.5" />
      </View>
      <Pip pose={over ? 'dizzy' : 'cheers-arms'} size={112} />
    </View>
  );
}

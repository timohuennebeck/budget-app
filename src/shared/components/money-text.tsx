import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { formatMoneyParts } from '@/shared/lib/money';
import { Text } from '@/shared/ui/text';

// Font size of the whole part; cents render at ~53%.
const SIZE = 60;

interface MoneyTextProps {
  amount: number;
  currency: string;
  className?: string;
}

/** "5.884" large with ",50 €" smaller, as in the hero amounts. */
export function MoneyText({ amount, currency, className }: MoneyTextProps) {
  const { whole, rest } = formatMoneyParts(amount, currency);
  return (
    <View className={cn('flex-row items-baseline', className)}>
      <Text size={SIZE} weight="bold" tracking={-0.05} leading={1}>
        {whole}
      </Text>
      {rest ? (
        <Text size={Math.round(SIZE * 0.53)} weight="bold" tracking={-0.05} leading={1}>
          {rest}
        </Text>
      ) : null}
    </View>
  );
}

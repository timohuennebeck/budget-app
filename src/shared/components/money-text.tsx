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
  /** Red, e.g. for a category over its limit */
  danger?: boolean;
  /** Shrinks the text for long amounts so it stays within this width */
  maxWidth?: number;
}

// Rough width of a bold Inter character, in em. Slightly generous so a fitted
// amount never touches its neighbour.
const CHAR_EM = 0.64;

/** "5.884" large with ",50 €" smaller, as in the hero amounts; long ones shrink to fit. */
export function MoneyText({ amount, currency, className, danger, maxWidth }: MoneyTextProps) {
  const { whole, rest } = formatMoneyParts(amount, currency);
  const fitted = maxWidth
    ? Math.floor(maxWidth / (CHAR_EM * (whole.length + 0.53 * rest.length)))
    : SIZE;
  const size = Math.max(28, Math.min(SIZE, fitted));
  const tone = danger ? 'text-danger-text' : undefined;
  return (
    <View className={cn('flex-row items-baseline', className)}>
      <Text size={size} weight="bold" tracking={-0.05} leading={1} className={tone}>
        {whole}
      </Text>
      {rest ? (
        <Text
          size={Math.round(size * 0.53)}
          weight="bold"
          tracking={-0.05}
          leading={1}
          className={tone}>
          {rest}
        </Text>
      ) : null}
    </View>
  );
}

import { View } from 'react-native';

import { MoneyText } from '@/shared/components/money-text';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

import { FloatingDecor } from './floating-decor';

const star = require('@/assets/images/decor/star.png');
const coin = require('@/assets/images/decor/coin.png');

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
      {/* A star and a coin drift around Pip, out of step with each other. */}
      <View>
        <Pip pose={over ? 'dizzy' : 'cheers-arms'} size={112} />
        <FloatingDecor
          source={star}
          size={26}
          tilt={12}
          lift={6}
          duration={3200}
          delay={0}
          position={{ top: -10, left: -14 }}
        />
        <FloatingDecor
          source={coin}
          size={30}
          tilt={-10}
          lift={7}
          duration={3800}
          delay={700}
          position={{ bottom: 6, right: -12 }}
        />
      </View>
    </View>
  );
}

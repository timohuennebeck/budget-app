import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useProfile } from '@/features/profile/hooks/use-profile';
import { AmountStepper, QuickAmounts } from '@/shared/components/amount-stepper';
import { Screen } from '@/shared/components/screen';
import { toISODate } from '@/shared/lib/dates';
import { haptics } from '@/shared/lib/haptics';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Text } from '@/shared/ui/text';

import { useCheckInState } from '../hooks/use-check-in-state';
import { useSaveCheckIn } from '../hooks/use-check-ins';
import { guessAccuracy } from '../lib/check-in-window';
import { CheckInHeader } from './check-in-header';

const roundTen = (value: number) => Math.max(10, Math.round(value / 10) * 10);

// "Was schätzt du?" (5f): same stepper as Monatsbudget, with last week's
// accuracy as a nudge. Saving reveals the real number.
export function GuessScreen() {
  const { t } = useTranslation();
  const { window, previous, actual } = useCheckInState();
  const { data: profile } = useProfile();
  const save = useSaveCheckIn();
  const currency = profile?.currency ?? 'EUR';

  const anchor = roundTen(Number(previous?.actual ?? actual) || 250);
  const [guess, setGuess] = useState(anchor);
  const options = [roundTen(anchor * 0.7), roundTen(anchor * 0.85), anchor, roundTen(anchor * 1.2)];
  const weekStart = toISODate(window.week.start);
  const lastAccuracy =
    previous?.guess !== null && previous?.guess !== undefined
      ? Math.round(guessAccuracy(Number(previous.guess), Number(previous.actual ?? 0)) * 100)
      : null;

  const reveal = () =>
    save.mutate(
      { week_start: weekStart, guess, actual, skipped: false },
      {
        onSuccess: () => {
          haptics.success();
          router.replace('/check-in/result');
        },
      },
    );

  const skip = () =>
    save.mutate(
      { week_start: weekStart, guess: null, actual, skipped: true },
      { onSuccess: () => router.dismissAll() },
    );

  return (
    <Screen
      gradient="sky"
      footer={
        <View>
          <Button label={t('checkIn.reveal')} loading={save.isPending} onPress={reveal} />
          <Button variant="ghost" className="mt-1" label={t('checkIn.skipWeek')} onPress={skip} />
        </View>
      }>
      <CheckInHeader window={window} />
      <Text variant="display" leading={1.08} className="mt-[22px]">
        {t('checkIn.guessTitle', { name: profile?.first_name ?? '' })}
      </Text>
      <Text variant="body" className="mt-2.5">
        {t('checkIn.guessSubtitle')}
      </Text>
      <Card className="mt-7 border-[#E0E7F2] px-[18px] pt-[26px] pb-[22px]">
        <AmountStepper
          value={guess}
          onChange={setGuess}
          currency={currency}
          hint={
            lastAccuracy === null
              ? t('checkIn.stepHint', { amount: formatMoney(10, { currency, compact: true }) })
              : t('checkIn.lastWeek', { percent: lastAccuracy })
          }
        />
      </Card>
      <QuickAmounts
        className="mt-4"
        options={options.map((value) => ({
          label: formatMoney(value, { currency, compact: true }),
          value,
        }))}
        selected={guess}
        onSelect={setGuess}
      />
    </Screen>
  );
}

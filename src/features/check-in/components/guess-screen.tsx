import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCurrency, useProfile } from '@/features/profile/hooks/use-profile';
import { AmountStepper, QuickAmounts } from '@/shared/components/amount-stepper';
import { Screen } from '@/shared/components/screen';
import { toISODate } from '@/shared/lib/dates';
import { haptics } from '@/shared/lib/haptics';
import { formatMoney, roundToStep } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Text } from '@/shared/ui/text';

import { useCheckInState } from '../hooks/use-check-in-state';
import { useSaveCheckIn } from '../hooks/use-check-ins';
import { accuracyPercent } from '../lib/check-in-window';
import { CheckInHeader } from './check-in-header';

const roundTen = (value: number) => roundToStep(value, 10);

// "Was schätzt du?" (5f): same stepper as Monatsbudget, with last week's
// accuracy as a nudge. Saving reveals the real number.
export function GuessScreen() {
  const state = useCheckInState();
  // The stepper starts at the anchor, so wait until last week is known.
  if (state.isLoading) return null;
  return <GuessForm window={state.window} previous={state.previous} actual={state.actual} />;
}

type GuessFormProps = Pick<ReturnType<typeof useCheckInState>, 'window' | 'previous' | 'actual'>;

function GuessForm({ window, previous, actual }: GuessFormProps) {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const save = useSaveCheckIn();
  const currency = useCurrency();

  // Anchor on last week's real spend, never this week's: that is the answer.
  const anchor = roundTen(Number(previous?.actual) || 250);
  const [guess, setGuess] = useState(anchor);
  const options = [roundTen(anchor * 0.7), roundTen(anchor * 0.85), anchor, roundTen(anchor * 1.2)];
  const weekStart = toISODate(window.week.start);
  const lastAccuracy = previous ? accuracyPercent(previous) : null;

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
          <Button variant="ghost" className="mt-2.5" label={t('checkIn.skipWeek')} onPress={skip} />
        </View>
      }>
      <CheckInHeader window={window} />
      <Text variant="display" leading={1.08} className="mt-[22px]">
        {t('checkIn.guessTitle', { name: profile?.first_name ?? '' })}
      </Text>
      <Text variant="body" className="mt-2.5">
        {t('checkIn.guessSubtitle')}
      </Text>
      <Card className="mt-7 border-line-card px-[18px] pt-[26px] pb-[22px]">
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

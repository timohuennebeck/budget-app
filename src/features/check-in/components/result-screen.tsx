import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCategoryLookup } from '@/features/categories/hooks/use-category-lookup';
import { EntryRow } from '@/features/entries/components/entry-row';
import { countByCategory, spendByCategory } from '@/features/entries/lib/entry-stats';
import { useCurrency } from '@/features/profile/hooks/use-profile';
import { Screen } from '@/shared/components/screen';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { formatMoney, roundMoney } from '@/shared/lib/money';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Icon } from '@/shared/ui/icon';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

import { useCheckInState } from '../hooks/use-check-in-state';
import { guessAccuracy } from '../lib/check-in-window';
import { AccuracyPill } from './accuracy-pill';
import { CheckInHeader } from './check-in-header';

// Reveal (5g-b): guess and actual side by side, accuracy pill and the
// biggest categories of the week. Close guesses get a trophy Pip.
export function ResultScreen() {
  const { t } = useTranslation();
  const { window, current, entries, actual } = useCheckInState();
  const { checkInCloseRatio } = useAppConfig();
  const categories = useCategoryLookup();
  const currency = useCurrency();

  const guess = Number(current?.guess ?? 0);
  const accuracy = guessAccuracy(guess, actual);
  const close = accuracy >= checkInCloseRatio;
  const difference = roundMoney(actual - guess);
  const money = (value: number, options: { signed?: boolean; compact?: boolean } = {}) =>
    formatMoney(value, { currency, ...options });

  const totals = spendByCategory(entries);
  const counts = countByCategory(entries);
  const biggest = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);

  return (
    <Screen
      gradient="mist"
      scroll
      footer={
        <View>
          <Button label={t('common.done')} onPress={() => router.dismissAll()} />
          <Button
            variant="ghost"
            className="mt-2.5"
            label={t('checkIn.viewHistory')}
            onPress={() => router.replace('/check-in/history')}
          />
        </View>
      }>
      <CheckInHeader window={window} />
      <Pip
        pose={close ? 'trophy-cheer' : 'magnifier'}
        size={150}
        style={{ alignSelf: 'center', marginTop: 14 }}
      />
      <View className="mt-1.5 items-center gap-2">
        <Text variant="display" leading={1.1} className="text-center">
          {close ? t('checkIn.closeTitle') : t('checkIn.farTitle')}
        </Text>
        <Text variant="body" weight="medium" className="text-center text-muted">
          {t('checkIn.offBy', { amount: money(Math.abs(difference)) })}
        </Text>
      </View>

      <Card className="mt-[22px] gap-3.5 px-[18px] pt-[18px] pb-4">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 gap-1">
            <Text size={13.5} className="text-muted-soft">
              {t('checkIn.guessed')}
            </Text>
            <Text size={30} weight="bold" tracking={-0.04} leading={1} className="text-subtle">
              {money(guess, { compact: true })}
            </Text>
          </View>
          <View className="size-[34px] items-center justify-center rounded-full bg-field">
            <Icon name="arrow-right" size={15} color={colors.muted} />
          </View>
          <View className="flex-1 items-end gap-1">
            <Text size={13.5} className="text-muted-soft">
              {t('checkIn.actual')}
            </Text>
            <Text size={30} weight="bold" tracking={-0.04} leading={1}>
              {money(actual, { compact: true })}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center justify-between">
          <Text size={14} className="flex-1 text-muted-soft">
            <Text size={14} weight="semibold">
              {money(difference, { signed: true })}
            </Text>{' '}
            {difference >= 0 ? t('checkIn.more') : t('checkIn.less')}
          </Text>
          <AccuracyPill size="md" accuracy={accuracy} />
        </View>
      </Card>

      {biggest.length ? (
        <>
          <Text size={15} weight="semibold" className="mx-1 mt-[22px] mb-2 text-muted">
            {t('checkIn.biggest')}
          </Text>
          <Card className="py-1">
            {biggest.map(([id, total]) => {
              const category = categories.get(id);
              if (!category) return null;
              return (
                <EntryRow
                  key={id}
                  icon={category.icon}
                  hue={category.hue}
                  title={category.name}
                  subtitle={t('entries.count', { count: counts.get(id) ?? 0 })}
                  amount={money(total)}
                />
              );
            })}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}

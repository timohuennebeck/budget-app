import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCategoryLookup } from '@/features/categories/hooks/use-category-lookup';
import { EntryRows } from '@/features/entries/components/entry-list';
import { useCurrency } from '@/features/profile/hooks/use-profile';
import { Screen } from '@/shared/components/screen';
import { StatusHero } from '@/shared/components/status-hero';
import { formatWeekday } from '@/shared/lib/dates';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Pip } from '@/shared/ui/pip';

import { useCheckInState } from '../hooks/use-check-in-state';
import { CheckInHeader } from './check-in-header';

// With fewer than N entries the comparison would mislead (5e): Pip asks to
// fill gaps first, but the user can still guess.
export function FewEntriesScreen() {
  const { t } = useTranslation();
  const { window, entries } = useCheckInState();
  const categories = useCategoryLookup();
  const currency = useCurrency();

  return (
    <Screen
      gradient="mist"
      footer={
        <View>
          <Button label={t('checkIn.addMissing')} onPress={() => router.push('/capture')} />
          <Button
            variant="ghost"
            className="mt-2.5"
            label={t('checkIn.guessAnyway')}
            onPress={() => router.replace('/check-in/guess')}
          />
        </View>
      }>
      <CheckInHeader week={window.week} />
      <View className="flex-1 items-center justify-center">
        <Pip pose="reading" size={200} />
      </View>
      <StatusHero
        title={t('checkIn.fewTitle')}
        subtitle={t('checkIn.fewSubtitle', { count: entries.length })}
      />
      {entries.length ? (
        <Card className="mt-5 py-1">
          <EntryRows
            entries={entries}
            categories={categories}
            currency={currency}
            subtitle={(entry, category) =>
              `${category ? category.name : t('entries.income')} · ${formatWeekday(new Date(entry.occurred_at), 'short')}`
            }
          />
        </Card>
      ) : null}
    </Screen>
  );
}

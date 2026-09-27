import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { categoryColumns, categoryIdOf } from '@/features/categories/lib/category-ref';
import { DateTimeSheet } from '@/features/entries/components/date-time-sheet';
import { useCreateEntries, useEntries } from '@/features/entries/hooks/use-entries';
import { useEntriesAllowance } from '@/features/paywall/hooks/use-entries-allowance';
import { AmountStepper, QuickAmounts } from '@/shared/components/amount-stepper';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { useSheet } from '@/shared/components/sheet';
import { addDays, formatDayLabel, formatTime, startOfDay } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Chip } from '@/shared/ui/chip';
import { Icon } from '@/shared/ui/icon';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { useCaptureStore } from '../data/capture-store';
import { useCaptureCategories } from '../hooks/use-capture-categories';
import { useCaptureContext } from '../hooks/use-capture-context';
import { captureHref } from '../lib/capture-routes';

const STEP = 50;
const QUICK_COUNT = 3;

/** Amounts received in the last half year, newest first, per category. */
function useRecentIncome() {
  const end = addDays(startOfDay(new Date()), 1);
  const { data: entries = [] } = useEntries({ start: addDays(end, -183), end });
  return useMemo(() => {
    const amounts = new Map<string, number[]>();
    for (const entry of entries) {
      const categoryId = categoryIdOf(entry);
      if (entry.kind !== 'income' || !categoryId) continue;
      const list = amounts.get(categoryId) ?? [];
      const amount = Number(entry.amount);
      if (!list.includes(amount)) list.push(amount);
      amounts.set(categoryId, list);
    }
    return amounts;
  }, [entries]);
}

// "Was kam rein?": logs money the user received. The same − / + stepper as
// the budget sheet (with cents), the income categories as chips and the
// user's recent amounts for the chosen one. The category name is the title.
// The entry lives as the only draft of a capture session, so the saved
// screen works as for parsed entries.
export function IncomeScreen() {
  const { t } = useTranslation();
  const { currency } = useCaptureContext('app');
  const categories = useCaptureCategories('app');
  const incomeCategories = categories.filter((category) => category.kind === 'income');
  const recent = useRecentIncome();
  const draft = useCaptureStore((state) => state.drafts[0]);
  const updateDraft = useCaptureStore((state) => state.updateDraft);
  const createEntries = useCreateEntries();
  const allowance = useEntriesAllowance();
  const dateSheet = useSheet();

  useEffect(() => {
    const store = useCaptureStore.getState();
    store.start();
    store.addDrafts([
      {
        id: randomUUID(),
        title: '',
        amount: 0,
        kind: 'income',
        categoryId: 'salary',
        source: 'manual',
        occurredAt: new Date().toISOString(),
        uncertain: false,
      },
    ]);
  }, []);

  if (!draft) return null;
  const category = incomeCategories.find((option) => option.id === draft.categoryId);
  const quick = (draft.categoryId ? (recent.get(draft.categoryId) ?? []) : []).slice(
    0,
    QUICK_COUNT,
  );
  const occurred = new Date(draft.occurredAt);

  const save = () => {
    if (!allowance.canAdd()) {
      router.push('/limit');
      return;
    }
    const title = category?.name ?? t('entries.income');
    updateDraft(draft.id, { title });
    createEntries
      .mutateAsync([
        {
          id: randomUUID(),
          title,
          amount: draft.amount,
          kind: 'income',
          ...categoryColumns(draft.categoryId),
          source: 'manual',
          capture_id: null,
          occurred_at: draft.occurredAt,
        },
      ])
      .catch(() => {});
    router.replace(captureHref('app', 'saved'));
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          label={t('income.save')}
          disabled={draft.amount <= 0}
          haptic="success"
          onPress={save}
        />
      }>
      <ScreenHeader leading="close" />
      <Text variant="display" className="mt-[22px]">
        {t('income.title')}
      </Text>
      <Text variant="body" className="mt-2.5">
        {t('income.subtitle')}
      </Text>

      <Card className="mt-7 border-line-card px-[18px] pt-[26px] pb-[22px]">
        <AmountStepper
          decimals
          step={STEP}
          value={draft.amount}
          currency={currency}
          onChange={(amount) => updateDraft(draft.id, { amount })}
          hint={t('checkIn.stepHint', {
            amount: formatMoney(STEP, { currency, compact: true }),
          })}
        />
      </Card>
      {quick.length ? (
        <QuickAmounts
          className="mt-4"
          options={quick.map((value) => ({
            label: formatMoney(value, { currency, compact: true }),
            value,
          }))}
          selected={draft.amount}
          onSelect={(amount) => updateDraft(draft.id, { amount })}
        />
      ) : null}

      <Text size={13} weight="semibold" className="mt-6 px-1 text-muted">
        {t('entries.category')}
      </Text>
      <View className="mt-2 flex-row flex-wrap gap-2">
        {incomeCategories.map((option) => (
          <Chip
            key={option.id}
            label={option.name}
            size="md"
            variant={option.id === draft.categoryId ? 'selected' : 'outline'}
            onPress={() => updateDraft(draft.id, { categoryId: option.id })}
          />
        ))}
      </View>

      <Pressable
        onPress={dateSheet.present}
        accessibilityLabel={t('entries.date')}
        className="mt-6 min-h-[52px] flex-row items-center gap-3 rounded-2xl border border-line bg-surface px-4">
        <Text size={15.5} className="flex-1 text-ink-soft">
          {t('entries.date')}
        </Text>
        <Text size={15.5} weight="medium">
          {`${formatDayLabel(occurred)}, ${formatTime(occurred)}`}
        </Text>
        <Icon name="caret-right" size={12} color={colors.chevron} />
      </Pressable>

      <DateTimeSheet
        {...dateSheet.controls}
        value={occurred}
        onSave={(date) => {
          updateDraft(draft.id, { occurredAt: date.toISOString() });
          dateSheet.dismiss();
        }}
      />
    </Screen>
  );
}

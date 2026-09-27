import { router, useNavigation } from 'expo-router';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { CategoryPill } from '@/features/categories/components/category-pill';
import { EntryRow } from '@/features/entries/components/entry-row';
import { useRecentEntries } from '@/features/entries/hooks/use-entries';
import { entrySubtitle, entryVisual } from '@/features/entries/lib/entry-display';
import { spendByCategory } from '@/features/entries/lib/entry-stats';
import { useRatingPrompt } from '@/features/rating/hooks/use-rating-prompt';
import { Screen } from '@/shared/components/screen';
import { StatusHero } from '@/shared/components/status-hero';
import { formatMoney, roundMoney } from '@/shared/lib/money';
import { playSound } from '@/shared/lib/sounds';
import { Button } from '@/shared/ui/button';
import { Pip } from '@/shared/ui/pip';

import { type CaptureMode, useCaptureStore } from '../data/capture-store';
import { useCaptureCategories } from '../hooks/use-capture-categories';
import { useCaptureContext } from '../hooks/use-capture-context';
import { draftRow } from '../lib/draft-row';
import type { DraftEntry } from '../lib/types';

interface SavedRow {
  key: string;
  icon: string;
  hue: number;
  title: string;
  subtitle: string;
  amount: number;
  kind: DraftEntry['kind'];
}

// Confirmation after saving (2s-e, 4c for income). Expenses are summed per
// category with the 30-day total; income is listed per entry.
export function SavedScreen({ mode }: { mode: CaptureMode }) {
  const { t } = useTranslation();
  const { currency } = useCaptureContext(mode);
  const drafts = useCaptureStore((state) => state.drafts);
  const categories = useCaptureCategories(mode);
  const { data: recent = [] } = useRecentEntries(mode === 'app');
  const ratingPrompt = useRatingPrompt();
  const navigation = useNavigation();

  const onlyIncome = drafts.length > 0 && drafts.every((draft) => draft.kind === 'income');
  const monthly = mode === 'app' ? spendByCategory(recent) : spendByCategory(drafts.map(draftRow));

  const rows: SavedRow[] = [];
  for (const draft of drafts) {
    const category = categories.find((option) => option.id === draft.categoryId);
    if (draft.kind === 'income' || !category) {
      rows.push({
        key: draft.id,
        ...entryVisual(draft.kind, category),
        title: draft.title,
        subtitle: `${entrySubtitle(draft, category?.name)} · ${t('common.today')}`,
        amount: draft.amount,
        kind: draft.kind,
      });
      continue;
    }
    const existing = rows.find((row) => row.key === category.id);
    if (existing) existing.amount = roundMoney(existing.amount + draft.amount);
    else
      rows.push({
        key: category.id,
        icon: category.icon,
        hue: category.hue,
        title: category.name,
        subtitle: t('capture.last30Days', {
          amount: formatMoney(monthly.get(category.id) ?? draft.amount, {
            currency,
            compact: true,
          }),
        }),
        amount: draft.amount,
        kind: 'expense',
      });
  }

  const income = drafts
    .filter((draft) => draft.kind === 'income')
    .reduce((sum, draft) => sum + draft.amount, 0);
  const spent = drafts
    .filter((draft) => draft.kind === 'expense')
    .reduce((sum, draft) => sum + draft.amount, 0);

  // Money in sounds right, money out sounds wrong; once, when the screen opens.
  const gained = income > spent;
  const hasDrafts = drafts.length > 0;
  useEffect(() => {
    if (hasDrafts) playSound(gained ? 'moneyIn' : 'moneyOut');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const next = () => {
    if (mode === 'onboarding') return router.replace('/budget-type');
    if (ratingPrompt.shouldAsk) return router.replace('/rating');
    // Close the whole capture modal. dismissAll() would only pop the nested
    // capture stack back to the text screen when the flow started there.
    navigation.getParent()?.goBack();
  };

  return (
    <Screen gradient="mist" scroll footer={<Button label={t('common.continue')} onPress={next} />}>
      <View className="min-h-[200px] flex-1 items-center justify-center">
        <Pip pose={onlyIncome ? 'money' : 'success'} size={230} />
      </View>
      <StatusHero
        subtitleClassName="max-w-none"
        title={onlyIncome ? t('capture.incomeSaved') : t('capture.saved')}
        subtitle={
          onlyIncome
            ? t('capture.incomeSavedSubtitle', {
                amount: formatMoney(income, { currency, compact: true }),
              })
            : t('capture.savedSubtitle')
        }
      />
      <View className="mt-4 px-1">
        {rows.map((row, index) => (
          <Animated.View key={row.key} entering={FadeInDown.delay(500 + index * 450).duration(450)}>
            <EntryRow
              compact
              icon={row.icon}
              hue={row.hue}
              title={row.title}
              subtitle={row.subtitle}
              amount=""
              trailing={
                <CategoryPill
                  size="md"
                  hue={row.kind === 'income' ? 150 : row.hue}
                  label={formatMoney(row.kind === 'income' ? row.amount : -row.amount, {
                    currency,
                    compact: true,
                    signed: true,
                  })}
                />
              }
            />
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

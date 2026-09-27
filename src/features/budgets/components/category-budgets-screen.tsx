import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { CategoryDisplay } from '@/features/categories/hooks/use-category-display';
import { StepIntro } from '@/features/onboarding/components/step-intro';
import { Screen } from '@/shared/components/screen';
import { useSheet } from '@/shared/components/sheet';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

import { BudgetLimitCard } from './budget-limit-card';
import { BudgetSheet } from './budget-sheet';

export interface CategoryBudgetItem {
  category: CategoryDisplay;
  limit: number | null;
  /** Typical monthly amount (peer average or last 30 days) */
  reference: number;
  hint: string;
  /** Shown up front; the rest waits behind "Alle Kategorien anzeigen" */
  featured: boolean;
}

interface CategoryBudgetsScreenProps {
  header: ReactNode;
  footer: ReactNode;
  items: CategoryBudgetItem[];
  currency: string;
  onSetLimit: (categoryId: string, limit: number | null) => void;
  /** False while the data deciding `featured` is still loading */
  ready?: boolean;
}

/** Two-column grid of category limits with an edit sheet (2e2 / 2e3). */
export function CategoryBudgetsScreen({
  header,
  footer,
  items,
  currency,
  onSetLimit,
  ready = true,
}: CategoryBudgetsScreenProps) {
  const { t } = useTranslation();
  const sheet = useSheet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  // Which items are featured is fixed once they load, so setting a limit
  // doesn't move a tile out from under the finger.
  const [featuredIds, setFeaturedIds] = useState<Set<string> | null>(null);
  if (featuredIds === null && ready && items.length) {
    setFeaturedIds(new Set(items.filter((item) => item.featured).map((item) => item.category.id)));
  }
  const editing = items.find((item) => item.category.id === editingId);
  const featured = items.filter((item) => featuredIds?.has(item.category.id));
  const more = items.filter((item) => !featuredIds?.has(item.category.id));

  const grid = (list: CategoryBudgetItem[]) => {
    const rows: CategoryBudgetItem[][] = [];
    for (let index = 0; index < list.length; index += 2) rows.push(list.slice(index, index + 2));
    return rows.map((row) => (
      <View key={row[0].category.id} className="flex-row gap-2.5">
        {row.map((item) => (
          <BudgetLimitCard
            key={item.category.id}
            name={item.category.name}
            icon={item.category.icon}
            hue={item.category.hue}
            limitLabel={
              item.limit === null ? null : formatMoney(item.limit, { currency, compact: true })
            }
            hint={item.hint}
            onPress={() => {
              setEditingId(item.category.id);
              sheet.present();
            }}
          />
        ))}
        {row.length === 1 ? <View className="flex-1" /> : null}
      </View>
    ));
  };

  return (
    <Screen scroll footer={footer}>
      {header}
      <StepIntro title={t('budgets.limitsTitle')} subtitle={t('budgets.limitsSubtitle')} />
      <View className="mt-8 gap-2.5">{grid(featured)}</View>
      {more.length ? (
        showAll ? (
          <>
            <Text size={14} weight="semibold" className="mt-7 mb-3 px-1 text-muted-soft">
              {t('budgets.moreCategories')}
            </Text>
            <View className="gap-2.5">{grid(more)}</View>
          </>
        ) : (
          <Button
            variant="ghost"
            className="mt-4"
            label={t('budgets.showAll', { count: more.length })}
            onPress={() => setShowAll(true)}
          />
        )
      ) : null}
      <BudgetSheet
        {...sheet.controls}
        title={editing?.category.name ?? ''}
        currency={currency}
        initial={editing?.limit ?? null}
        reference={editing?.reference ?? 100}
        hint={editing?.hint ?? ''}
        onSave={(limit) => {
          if (editing) onSetLimit(editing.category.id, limit);
          sheet.dismiss();
        }}
      />
    </Screen>
  );
}

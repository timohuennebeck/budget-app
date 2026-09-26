import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import type { CategoryDisplay } from '@/features/categories/hooks/use-category-display';
import { StepIntro } from '@/features/onboarding/components/step-intro';
import { Screen } from '@/shared/components/screen';
import { useSheet } from '@/shared/components/sheet';
import { formatMoney } from '@/shared/lib/money';

import { BudgetLimitCard } from './budget-limit-card';
import { BudgetSheet } from './budget-sheet';

export interface CategoryBudgetItem {
  category: CategoryDisplay;
  limit: number | null;
  /** Typical monthly amount (peer average or last 30 days) */
  reference: number;
  hint: string;
}

interface CategoryBudgetsScreenProps {
  header: ReactNode;
  footer: ReactNode;
  items: CategoryBudgetItem[];
  currency: string;
  onSetLimit: (categoryId: string, limit: number | null) => void;
}

/** Two-column grid of category limits with an edit sheet (2e2 / 2e3). */
export function CategoryBudgetsScreen({
  header,
  footer,
  items,
  currency,
  onSetLimit,
}: CategoryBudgetsScreenProps) {
  const { t } = useTranslation();
  const sheet = useSheet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = items.find((item) => item.category.id === editingId);

  const rows: CategoryBudgetItem[][] = [];
  for (let index = 0; index < items.length; index += 2) rows.push(items.slice(index, index + 2));

  return (
    <Screen scroll footer={footer}>
      {header}
      <StepIntro title={t('budgets.limitsTitle')} subtitle={t('budgets.limitsSubtitle')} />
      <View className="mt-[22px] gap-2.5">
        {rows.map((row) => (
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
        ))}
      </View>
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

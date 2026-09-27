import { useLocalSearchParams } from 'expo-router';

import { CategoryBudgetScreen } from '@/features/budgets/components/category-budget-screen';
import { fromISODate } from '@/shared/lib/dates';

// ?month=YYYY-MM-DD (a budget month's first day) shows a past month.
export default function CategoryBudgetRoute() {
  const { id, month } = useLocalSearchParams<{ id: string; month?: string }>();
  return <CategoryBudgetScreen id={id} month={month ? fromISODate(month) : undefined} />;
}

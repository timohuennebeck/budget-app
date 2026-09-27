import { useLocalSearchParams } from 'expo-router';

import { CategoryBudgetScreen } from '@/features/budgets/components/category-budget-screen';

export default function CategoryBudgetRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CategoryBudgetScreen id={id} />;
}

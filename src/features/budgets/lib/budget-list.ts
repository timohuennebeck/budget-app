import type { CategoryDisplay } from '@/features/categories/hooks/use-category-display';

export interface BudgetListRow {
  category: CategoryDisplay;
  spent: number;
  limit: number | null;
}

/**
 * The Budgets tab: categories with spending or a limit this month, the most
 * spent first, then the ones without either (shown greyed to set a limit).
 */
export function budgetList(
  categories: CategoryDisplay[],
  limits: Map<string, number>,
  spent: Map<string, number>,
) {
  const rows = categories.map((category) => ({
    category,
    spent: spent.get(category.id) ?? 0,
    limit: limits.get(category.id) ?? null,
  }));
  return {
    active: rows
      .filter((row) => row.spent > 0 || row.limit !== null)
      .sort((a, b) => b.spent - a.spent),
    idle: rows.filter((row) => row.spent === 0 && row.limit === null),
  };
}

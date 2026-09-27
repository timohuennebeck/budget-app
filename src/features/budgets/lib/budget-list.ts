import type { CategoryDisplay } from '@/features/categories/hooks/use-category-display';

export interface BudgetListRow {
  category: CategoryDisplay;
  spent: number;
  limit: number | null;
}

const used = (row: BudgetListRow) => row.spent / row.limit!;

/**
 * The Budgets tab in three groups: categories with a limit (the most used
 * first, so the tight ones lead), spending without a limit (the most spent
 * first), and the rest, which have neither.
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
    budgets: rows.filter((row) => row.limit !== null).sort((a, b) => used(b) - used(a)),
    unlimited: rows
      .filter((row) => row.limit === null && row.spent > 0)
      .sort((a, b) => b.spent - a.spent),
    idle: rows.filter((row) => row.limit === null && row.spent === 0),
  };
}

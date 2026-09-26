import type { Category } from '@/features/categories/data/categories-api';
import type { Entry } from '@/features/entries/data/entries-api';
import { spendByCategory, sumExpenses } from '@/features/entries/lib/entry-stats';
import type { Profile } from '@/features/profile/data/profile-api';
import { budgetCycle, daysBetween } from '@/shared/lib/dates';
import { roundMoney } from '@/shared/lib/money';

export interface BudgetCard {
  category: Category;
  limit: number;
  spent: number;
  /** Negative when the category is over budget */
  remaining: number;
}

export interface SpendSegment {
  categoryId: string;
  hue: number;
  amount: number;
}

export interface BudgetSummary {
  /** Monthly total the user plans with, or null without a budget */
  total: number | null;
  spent: number;
  free: number | null;
  daysLeft: number;
  freePerDay: number | null;
  averagePerDay: number;
  segments: SpendSegment[];
  cards: BudgetCard[];
}

type BudgetProfile = Pick<Profile, 'budget_mode' | 'monthly_budget' | 'month_start_day'>;

// The monthly budget wins; category limits add up to a total otherwise.
function plannedTotal(profile: BudgetProfile, categoryTotal: number) {
  if (profile.budget_mode === 'none') return null;
  if (profile.monthly_budget !== null) return Number(profile.monthly_budget);
  return categoryTotal > 0 ? categoryTotal : null;
}

// Everything the overview needs from one pass over the cycle's entries: the
// hero number, the coloured spend bar and one card per limited category.
export function summarizeBudget(
  profile: BudgetProfile,
  categories: Category[],
  entries: Entry[],
  now = new Date(),
): BudgetSummary {
  const cycle = budgetCycle(now, profile.month_start_day);
  const byCategory = spendByCategory(entries);
  const spent = sumExpenses(entries);

  const limited = categories.filter((category) => category.monthly_limit !== null);
  const categoryTotal = roundMoney(
    limited.reduce((sum, category) => sum + Number(category.monthly_limit), 0),
  );
  const total = plannedTotal(profile, categoryTotal);

  const daysLeft = Math.max(1, daysBetween(now, cycle.end));
  const daysPassed = Math.max(1, daysBetween(cycle.start, now) + 1);
  const free = total === null ? null : roundMoney(total - spent);

  return {
    total,
    spent,
    free,
    daysLeft,
    freePerDay: free === null ? null : Math.max(0, Math.floor(free / daysLeft)),
    averagePerDay: Math.round(spent / daysPassed),
    segments: categories
      .filter((category) => (byCategory.get(category.id) ?? 0) > 0)
      .map((category) => ({
        categoryId: category.id,
        hue: category.hue,
        amount: byCategory.get(category.id)!,
      }))
      .sort((a, b) => b.amount - a.amount),
    // The per-category cards only show in that mode; totals still use limits.
    cards: (profile.budget_mode === 'per_category' ? limited : []).map((category) => {
      const categorySpent = byCategory.get(category.id) ?? 0;
      const limit = Number(category.monthly_limit);
      return {
        category,
        limit,
        spent: categorySpent,
        remaining: roundMoney(limit - categorySpent),
      };
    }),
  };
}

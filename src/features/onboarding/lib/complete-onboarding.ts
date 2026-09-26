import i18n from 'i18next';

import {
  type CategoryInsert,
  fetchCategories,
  insertCategories,
} from '@/features/categories/data/categories-api';
import { findCatalogCategory } from '@/features/categories/data/category-catalog';
import { categoryName } from '@/features/categories/lib/category-name';
import { hasEntries, insertEntries } from '@/features/entries/data/entries-api';
import { acceptLegalDocuments } from '@/features/legal/data/legal-api';
import { updateProfile } from '@/features/profile/data/profile-api';
import { deviceTimeZone } from '@/shared/lib/dates';

import type { OnboardingDraft } from '../data/onboarding-store';

// Writes everything collected during onboarding to the new account: profile
// answers, chosen categories with limits, the first captured entries and
// the accepted legal documents. Runs right after sign-up and is safe to
// re-run when a previous attempt failed halfway (nothing is inserted twice).
// Only the first `freeEntries` drafts are saved: the database rejects more.
export async function completeOnboarding(
  userId: string,
  draft: OnboardingDraft,
  freeEntries: number,
) {
  const locale = i18n.language;

  await updateProfile(userId, {
    first_name: draft.firstName,
    currency: draft.currency,
    locale,
    time_zone: deviceTimeZone(),
    birth_date: draft.birthDate,
    budget_mode: draft.budgetMode,
    monthly_budget: draft.budgetMode === 'monthly' ? draft.monthlyBudget : null,
    reminder_enabled: draft.reminderEnabled,
    reminder_time: draft.reminderTime,
    reminder_repeat: draft.reminderRepeat,
  });

  // Categories the first entries landed in are kept even if deselected later.
  const usedIds = draft.entries.map((entry) => entry.categoryId).filter((id): id is string => !!id);
  const categoryIds = [...new Set([...draft.categoryIds, ...usedIds])];
  const existing = await fetchCategories();

  // The row a draft id (catalog key or custom draft id) becomes.
  const describe = (id: string) => {
    const catalog = findCatalogCategory(id);
    if (catalog) {
      const { key, icon, hue } = catalog;
      return { key, name: categoryName({ key, name: '' }), icon, hue };
    }
    const custom = draft.customCategories.find((category) => category.id === id);
    return custom && { key: null, name: custom.name, icon: custom.icon, hue: custom.hue };
  };
  const findSaved = (id: string, rows: typeof existing) => {
    const category = describe(id);
    if (!category) return undefined;
    return rows.find((row) =>
      category.key ? row.key === category.key : row.key === null && row.name === category.name,
    );
  };

  const rows = categoryIds.flatMap((id, index): CategoryInsert[] => {
    const category = describe(id);
    if (!category || findSaved(id, existing)) return [];
    const limit = draft.budgetMode === 'per_category' ? (draft.categoryLimits[id] ?? null) : null;
    return [{ profile_id: userId, ...category, monthly_limit: limit, sort_order: index }];
  });

  const created = rows.length ? await insertCategories(rows) : [];
  const saved = [...existing, ...created];

  if (draft.entries.length && !(await hasEntries())) {
    await insertEntries(
      draft.entries.slice(0, freeEntries).map((entry) => ({
        profile_id: userId,
        title: entry.title,
        amount: entry.amount,
        total_amount: entry.totalAmount,
        kind: entry.kind,
        source: entry.source,
        occurred_at: entry.occurredAt,
        category_id: entry.categoryId ? (findSaved(entry.categoryId, saved)?.id ?? null) : null,
      })),
    );
  }

  await acceptLegalDocuments(userId, locale);
}

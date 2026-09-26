import i18n from 'i18next';

import { type CategoryInsert, insertCategories } from '@/features/categories/data/categories-api';
import { findCatalogCategory } from '@/features/categories/data/category-catalog';
import { categoryName } from '@/features/categories/lib/category-name';
import { insertEntries } from '@/features/entries/data/entries-api';
import { acceptLegalDocuments } from '@/features/legal/data/legal-api';
import { updateProfile } from '@/features/profile/data/profile-api';

import type { OnboardingDraft } from '../data/onboarding-store';

// Writes everything collected during onboarding to the new account: profile
// answers, chosen categories with limits, the first captured entries and
// the accepted legal documents. Runs right after sign-up.
export async function completeOnboarding(userId: string, draft: OnboardingDraft) {
  const locale = i18n.language;

  await updateProfile(userId, {
    first_name: draft.firstName,
    currency: draft.currency,
    locale,
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

  const rows = categoryIds.flatMap((id, index): CategoryInsert[] => {
    const limit = draft.budgetMode === 'per_category' ? (draft.categoryLimits[id] ?? null) : null;
    const catalog = findCatalogCategory(id);
    if (catalog) {
      return [
        {
          profile_id: userId,
          key: catalog.key,
          name: categoryName({ key: catalog.key, name: '' }),
          icon: catalog.icon,
          hue: catalog.hue,
          monthly_limit: limit,
          sort_order: index,
        },
      ];
    }
    const custom = draft.customCategories.find((category) => category.id === id);
    return custom
      ? [
          {
            profile_id: userId,
            key: null,
            name: custom.name,
            icon: custom.icon,
            hue: custom.hue,
            monthly_limit: limit,
            sort_order: index,
          },
        ]
      : [];
  });

  const created = rows.length ? await insertCategories(rows) : [];
  // sort_order is the index into categoryIds, so it maps drafts to rows.
  const idFor = new Map(created.map((category) => [categoryIds[category.sort_order], category.id]));

  if (draft.entries.length) {
    await insertEntries(
      draft.entries.map((entry) => ({
        profile_id: userId,
        title: entry.title,
        amount: entry.amount,
        total_amount: entry.totalAmount,
        kind: entry.kind,
        source: entry.source,
        occurred_at: entry.occurredAt,
        category_id: entry.categoryId ? (idFor.get(entry.categoryId) ?? null) : null,
      })),
    );
  }

  await acceptLegalDocuments(userId, locale);
}

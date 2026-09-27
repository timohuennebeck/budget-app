import i18n from 'i18next';

import {
  type CategoryInsert,
  fetchCategories,
  insertCategories,
} from '@/features/categories/data/categories-api';
import { presetQueries } from '@/features/categories/data/categories-queries';
import { presetName } from '@/features/categories/lib/category-name';
import { hasEntries, insertEntries } from '@/features/entries/data/entries-api';
import { acceptLegalDocuments } from '@/features/legal/data/legal-api';
import { updateNotificationSettings } from '@/features/notifications/data/notifications-api';
import { updateProfile } from '@/features/profile/data/profile-api';
import { deviceTimeZone } from '@/shared/lib/dates';
import { queryClient } from '@/shared/lib/query-client';

import type { OnboardingDraft } from '../data/onboarding-store';
import { resolveCategoryIds } from './category-ids';

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
  });
  await updateNotificationSettings(['daily_reminder'], {
    enabled: draft.reminderEnabled,
    time: draft.reminderTime,
    repeat: draft.reminderRepeat,
  });

  // Categories the first entries landed in are kept even if deselected later.
  const usedIds = draft.entries.map((entry) => entry.categoryId).filter((id): id is string => !!id);
  const presets = await queryClient.fetchQuery({ ...presetQueries.list, staleTime: Infinity });
  const categoryIds = [...new Set([...resolveCategoryIds(draft.categoryIds, presets), ...usedIds])];
  const existing = await fetchCategories();

  // The row each draft id (preset key or custom draft id) becomes.
  const describe = (id: string) => {
    const preset = presets.find((row) => row.key === id);
    if (preset) {
      const { key, icon, hue } = preset;
      return { preset_key: key, name: presetName(preset, locale), icon, hue };
    }
    const custom = draft.customCategories.find((category) => category.id === id);
    return custom && { preset_key: null, name: custom.name, icon: custom.icon, hue: custom.hue };
  };
  const described = new Map(categoryIds.map((id) => [id, describe(id)]));
  const findSaved = (id: string, rows: typeof existing) => {
    const category = described.get(id);
    if (!category) return undefined;
    return rows.find((row) =>
      category.preset_key
        ? row.preset_key === category.preset_key
        : row.preset_key === null && row.name === category.name,
    );
  };

  const rows = categoryIds.flatMap((id, index): CategoryInsert[] => {
    const category = described.get(id);
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
        kind: entry.kind,
        source: entry.source,
        occurred_at: entry.occurredAt,
        category_id: entry.categoryId ? (findSaved(entry.categoryId, saved)?.id ?? null) : null,
      })),
    );
  }

  await acceptLegalDocuments(userId, locale);
}

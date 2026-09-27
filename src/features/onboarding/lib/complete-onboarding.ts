import i18n from 'i18next';

import { upsertLimits } from '@/features/categories/data/limits-api';
import { draftRow } from '@/features/capture/lib/draft-row';
import { hasEntries, insertEntries } from '@/features/entries/data/entries-api';
import { acceptLegalDocuments } from '@/features/legal/data/legal-api';
import { updateNotificationSettings } from '@/features/notifications/data/notifications-api';
import { updateProfile } from '@/features/profile/data/profile-api';
import { deviceTimeZone } from '@/shared/lib/dates';

import type { OnboardingDraft } from '../data/onboarding-store';

// Writes everything collected during onboarding to the new account: profile
// answers, category limits, the first captured entries and the accepted
// legal documents. Runs right after sign-up and is safe to
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

  // Limits by preset id; re-running just overwrites them.
  if (draft.budgetMode === 'per_category') {
    await upsertLimits(userId, Object.entries(draft.categoryLimits));
  }

  if (draft.entries.length && !(await hasEntries())) {
    await insertEntries(
      draft.entries
        .slice(0, freeEntries)
        .map((entry) => ({ profile_id: userId, ...draftRow(entry) })),
    );
  }

  await acceptLegalDocuments(userId, locale);
}

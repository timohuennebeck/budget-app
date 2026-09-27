import i18n from 'i18next';

import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { deviceTimeZone } from '@/shared/lib/dates';
import { supabase } from '@/shared/lib/supabase';

/**
 * The signed-in user's id; during onboarding, signs in anonymously first so
 * AI capture works before sign-up (sign-up later attaches e-mail and
 * password to this same user). Null when anonymous sign-ins are disabled.
 */
export async function ensureUser(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return data.session.user.id;

  const draft = useOnboardingStore.getState();
  const { data: created, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        first_name: draft.firstName,
        currency: draft.currency,
        locale: i18n.language,
        time_zone: deviceTimeZone(),
      },
    },
  });
  if (error) {
    console.warn('Anonymous sign-in failed', error.message);
    return null;
  }
  return created.user?.id ?? null;
}

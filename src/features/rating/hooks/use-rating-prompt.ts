import { useEntryStats } from '@/features/entries/hooks/use-entries';
import { useProfile, useUpdateProfile } from '@/features/profile/hooks/use-profile';

const ENTRIES_BEFORE_ASKING = 10;

/** Ask for a rating once per account, after the user has captured a few entries. */
export function useRatingPrompt() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const asked = !profile || !!profile.rating_prompted_at;
  const { data: stats } = useEntryStats(!asked);

  return {
    shouldAsk: !asked && (stats?.total ?? 0) >= ENTRIES_BEFORE_ASKING,
    markAsked: () => updateProfile.mutate({ rating_prompted_at: new Date().toISOString() }),
  };
}

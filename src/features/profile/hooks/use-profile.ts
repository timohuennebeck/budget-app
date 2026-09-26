import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '@/features/auth/lib/auth-provider';
import { restore, snapshot } from '@/shared/lib/optimistic';

import { type Profile, type ProfileUpdate, updateProfile } from '../data/profile-api';
import { profileQueries } from '../data/profile-queries';

export function useProfile() {
  const userId = useUserId();
  return useQuery({ ...profileQueries.detail(userId), enabled: !!userId });
}

/** The profile's currency, EUR until the profile has loaded. */
export function useCurrency() {
  const { data: profile } = useProfile();
  return profile?.currency ?? 'EUR';
}

/** Optimistically patches the cached profile so settings feel instant. */
export function useUpdateProfile() {
  const userId = useUserId();
  const client = useQueryClient();
  const key = profileQueries.detail(userId).queryKey;

  return useMutation({
    mutationFn: (patch: ProfileUpdate) => updateProfile(userId, patch),
    meta: { optimistic: true },
    onMutate: async (patch) => {
      const saved = await snapshot(client, { queryKey: key });
      client.setQueryData<Profile>(key, (profile) => profile && { ...profile, ...patch });
      return { saved };
    },
    onError: (_error, _patch, context) => restore(client, context?.saved),
    onSuccess: (profile) => client.setQueryData(key, profile),
  });
}

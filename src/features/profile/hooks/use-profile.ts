import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '@/features/auth/lib/auth-provider';

import { fetchProfile, type Profile, type ProfileUpdate, updateProfile } from '../data/profile-api';

export const profileKey = (userId: string) => ['profile', userId] as const;

export const profileQuery = (userId: string) =>
  queryOptions({ queryKey: profileKey(userId), queryFn: () => fetchProfile(userId) });

export function useProfile() {
  const userId = useUserId();
  return useQuery({ ...profileQuery(userId), enabled: !!userId });
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

  return useMutation({
    mutationFn: (patch: ProfileUpdate) => updateProfile(userId, patch),
    onMutate: async (patch) => {
      await client.cancelQueries({ queryKey: profileKey(userId) });
      const previous = client.getQueryData<Profile>(profileKey(userId));
      if (previous) client.setQueryData(profileKey(userId), { ...previous, ...patch });
      return { previous };
    },
    onError: (_error, _patch, context) => {
      if (context?.previous) client.setQueryData(profileKey(userId), context.previous);
    },
    onSuccess: (profile) => client.setQueryData(profileKey(userId), profile),
  });
}

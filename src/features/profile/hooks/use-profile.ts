import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/features/auth/lib/auth-provider';

import { fetchProfile, type Profile, type ProfileUpdate, updateProfile } from '../data/profile-api';

export const profileKey = (userId: string) => ['profile', userId] as const;

export function useProfile() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: profileKey(userId ?? ''),
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
  });
}

/** Optimistically patches the cached profile so settings feel instant. */
export function useUpdateProfile() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
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

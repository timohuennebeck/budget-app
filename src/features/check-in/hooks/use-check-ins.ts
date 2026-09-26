import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '@/features/auth/lib/auth-provider';
import type { TablesInsert } from '@/shared/lib/database.types';

import { fetchCheckIns, saveCheckIn } from '../data/check-ins-api';

const checkInsKey = ['check-ins'] as const;

export function useCheckIns() {
  return useQuery({ queryKey: checkInsKey, queryFn: fetchCheckIns });
}

export function useSaveCheckIn() {
  const userId = useUserId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (row: Omit<TablesInsert<'weekly_check_ins'>, 'profile_id'>) =>
      saveCheckIn({ ...row, profile_id: userId }),
    onSuccess: () => client.invalidateQueries({ queryKey: checkInsKey }),
  });
}

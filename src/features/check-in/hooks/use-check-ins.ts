import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '@/features/auth/lib/auth-provider';
import type { TablesInsert } from '@/shared/lib/database.types';
import { restore, snapshot } from '@/shared/lib/optimistic';

import { type CheckIn, saveCheckIn } from '../data/check-ins-api';
import { checkInQueries } from '../data/check-ins-queries';

const listKey = checkInQueries.list.queryKey;

export function useCheckIns() {
  return useQuery(checkInQueries.list);
}

type CheckInSave = Omit<TablesInsert<'weekly_check_ins'>, 'profile_id'>;

/** Upserts this week's check-in; the result screen can read it right away. */
export function useSaveCheckIn() {
  const userId = useUserId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (row: CheckInSave) => saveCheckIn({ ...row, profile_id: userId }),
    meta: { optimistic: true },
    onMutate: async (row) => {
      const saved = await snapshot(client, { queryKey: listKey });
      client.setQueryData<CheckIn[]>(listKey, (list = []) => {
        const current = list.find((checkIn) => checkIn.week_start === row.week_start);
        const next: CheckIn = {
          id: current?.id ?? `pending-${row.week_start}`,
          created_at: current?.created_at ?? new Date().toISOString(),
          guess: null,
          actual: null,
          skipped: false,
          ...current,
          ...row,
          profile_id: userId,
        };
        const others = list.filter((checkIn) => checkIn.week_start !== row.week_start);
        return [next, ...others].sort((a, b) => b.week_start.localeCompare(a.week_start));
      });
      return { saved };
    },
    onError: (_error, _row, context) => restore(client, context?.saved),
    onSettled: () => client.invalidateQueries({ queryKey: checkInQueries._def }),
  });
}

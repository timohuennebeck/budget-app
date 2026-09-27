import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '@/features/auth/lib/auth-provider';
import { restore, snapshot } from '@/shared/lib/optimistic';

import { limitQueries } from '../data/categories-queries';
import { type CategoryLimit, positiveOrNull, setLimit } from '../data/limits-api';
import { categoryColumns, categoryIdOf } from '../lib/category-ref';

const listKey = limitQueries.list.queryKey;

const byCategory = (rows: CategoryLimit[]) =>
  new Map(rows.map((row) => [categoryIdOf(row)!, Number(row.amount)]));

/** Monthly limits by category id (preset or own category). */
export function useCategoryLimits() {
  return useQuery({ ...limitQueries.list, select: byCategory });
}

export function useSetCategoryLimit() {
  const userId = useUserId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, limit }: { id: string; limit: number | null }) =>
      setLimit(userId, id, limit),
    meta: { optimistic: true },
    onMutate: async ({ id, limit: requested }) => {
      const limit = positiveOrNull(requested);
      const saved = await snapshot(client, { queryKey: listKey });
      client.setQueryData<CategoryLimit[]>(listKey, (rows) => {
        if (!rows) return rows;
        const others = rows.filter((row) => categoryIdOf(row) !== id);
        if (limit === null) return others;
        const row: CategoryLimit = {
          id: `pending-${id}`,
          profile_id: userId,
          ...categoryColumns(id),
          amount: limit,
          created_at: new Date().toISOString(),
        };
        return [...others, row];
      });
      return { saved };
    },
    onError: (_error, _variables, context) => restore(client, context?.saved),
    onSettled: () => client.invalidateQueries({ queryKey: limitQueries._def }),
  });
}

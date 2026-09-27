import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '@/features/auth/lib/auth-provider';
import { restore, snapshot } from '@/shared/lib/optimistic';

import { type Category, type CategoryInsert, insertCategories } from '../data/categories-api';
import { categoryQueries } from '../data/categories-queries';

const listKey = categoryQueries.list.queryKey;

/** The user's own categories, archived ones included, so old entries keep theirs. */
export function useCategories(enabled = true) {
  return useQuery({ ...categoryQueries.list, enabled });
}

/** New categories carry their id (expo-crypto randomUUID) so the list updates at once. */
export type NewCategory = Omit<CategoryInsert, 'profile_id'> & { id: string };

// Shows the new category in the cached list right away; rolls back on error.
export function useCreateCategory() {
  const userId = useUserId();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (category: NewCategory) => insertCategories([{ ...category, profile_id: userId }]),
    meta: { optimistic: true },
    onMutate: async (category) => {
      const saved = await snapshot(client, { queryKey: listKey });
      client.setQueryData<Category[]>(
        listKey,
        (list) =>
          list && [
            ...list,
            {
              archived_at: null,
              sort_order: list.length,
              created_at: new Date().toISOString(),
              ...category,
              profile_id: userId,
            },
          ],
      );
      return { saved };
    },
    onError: (_error, _variables, context) => restore(client, context?.saved),
    onSettled: () => client.invalidateQueries({ queryKey: categoryQueries._def }),
  });
}

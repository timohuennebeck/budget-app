import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '@/features/auth/lib/auth-provider';
import { restore, snapshot } from '@/shared/lib/optimistic';

import {
  type Category,
  type CategoryInsert,
  insertCategories,
  updateCategory,
} from '../data/categories-api';
import { categoryQueries } from '../data/categories-queries';

const listKey = categoryQueries.list.queryKey;

/** All categories, archived ones included, so old entries keep theirs. */
export function useCategories(enabled = true) {
  return useQuery({ ...categoryQueries.list, enabled });
}

const withoutArchived = (list: Category[]) => list.filter((category) => !category.archived_at);

/** Categories the user can still pick and budget. */
export function useActiveCategories(enabled = true) {
  return useQuery({ ...categoryQueries.list, enabled, select: withoutArchived });
}

/** New categories carry their id (expo-crypto randomUUID) so the list updates at once. */
export type NewCategory = Omit<CategoryInsert, 'profile_id'> & { id: string };

// Shows the change in the cached list right away and rolls it back on error.
function useCategoryMutation<T>(
  mutationFn: (variables: T) => Promise<unknown>,
  apply: (list: Category[], variables: T) => Category[],
) {
  const client = useQueryClient();
  return useMutation({
    mutationFn,
    meta: { optimistic: true },
    onMutate: async (variables: T) => {
      const saved = await snapshot(client, { queryKey: listKey });
      client.setQueryData<Category[]>(listKey, (list) => list && apply(list, variables));
      return { saved };
    },
    onError: (_error, _variables, context) => restore(client, context?.saved),
    onSettled: () => client.invalidateQueries({ queryKey: categoryQueries._def }),
  });
}

export function useCreateCategory() {
  const userId = useUserId();
  return useCategoryMutation(
    (category: NewCategory) => insertCategories([{ ...category, profile_id: userId }]),
    (list, category) => [
      ...list,
      {
        preset_id: null,
        monthly_limit: null,
        archived_at: null,
        sort_order: list.length,
        created_at: new Date().toISOString(),
        ...category,
        profile_id: userId,
      },
    ],
  );
}

export function useSetCategoryLimit() {
  return useCategoryMutation(
    ({ id, limit }: { id: string; limit: number | null }) =>
      updateCategory(id, { monthly_limit: limit }),
    (list, { id, limit }) =>
      list.map((category) =>
        category.id === id ? { ...category, monthly_limit: limit } : category,
      ),
  );
}

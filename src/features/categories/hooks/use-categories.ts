import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useUserId } from '@/features/auth/lib/auth-provider';

import {
  type Category,
  type CategoryInsert,
  fetchCategories,
  insertCategories,
  updateCategory,
} from '../data/categories-api';

const categoriesKey = ['categories'] as const;

export function useCategories(enabled = true) {
  return useQuery({ queryKey: categoriesKey, queryFn: fetchCategories, enabled });
}

export function useCreateCategory() {
  const client = useQueryClient();
  const userId = useUserId();
  return useMutation({
    mutationFn: async (category: Omit<CategoryInsert, 'profile_id'>) => {
      const [created] = await insertCategories([{ ...category, profile_id: userId }]);
      return created;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: categoriesKey }),
  });
}

export function useSetCategoryLimit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, limit }: { id: string; limit: number | null }) =>
      updateCategory(id, { monthly_limit: limit }),
    onMutate: ({ id, limit }) => {
      client.setQueryData<Category[]>(categoriesKey, (current) =>
        current?.map((category) =>
          category.id === id ? { ...category, monthly_limit: limit } : category,
        ),
      );
    },
    onSettled: () => client.invalidateQueries({ queryKey: categoriesKey }),
  });
}

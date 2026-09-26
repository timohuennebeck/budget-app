import { router } from 'expo-router';

import { NewCategoryScreen } from '@/features/categories/components/new-category-screen';
import { useCategories, useCreateCategory } from '@/features/categories/hooks/use-categories';
import { ScreenHeader } from '@/shared/components/screen-header';

export default function NewCategoryRoute() {
  const { data: categories = [] } = useCategories();
  const create = useCreateCategory();
  return (
    <NewCategoryScreen
      header={<ScreenHeader />}
      loading={create.isPending}
      onSubmit={(values) =>
        create.mutate(
          { ...values, sort_order: categories.length },
          { onSuccess: () => router.back() },
        )
      }
    />
  );
}

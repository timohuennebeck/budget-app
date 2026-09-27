import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';

import {
  NewCategoryScreen,
  type NewCategoryValues,
} from '@/features/categories/components/new-category-screen';
import { useCategories, useCreateCategory } from '@/features/categories/hooks/use-categories';
import { usePresetDisplays } from '@/features/categories/hooks/use-category-display';
import { ScreenHeader } from '@/shared/components/screen-header';

export default function NewCategoryRoute() {
  const { data: categories = [] } = useCategories();
  const presets = usePresetDisplays();
  const create = useCreateCategory();
  const owned = new Set(categories.map((category) => category.preset_id));

  const add = (values: NewCategoryValues & { preset_id?: string | null }) => {
    create.mutate({ ...values, id: randomUUID(), sort_order: categories.length });
    router.back();
  };

  return (
    <NewCategoryScreen
      header={<ScreenHeader />}
      suggestions={presets.filter((preset) => !owned.has(preset.presetId))}
      onPickSuggestion={({ presetId, name, icon, hue }) =>
        add({ preset_id: presetId, name, icon, hue })
      }
      onSubmit={add}
    />
  );
}

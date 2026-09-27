import { router, useLocalSearchParams } from 'expo-router';

import { CategoryPickerScreen } from '@/features/categories/components/category-picker-screen';
import { categoryColumns, categoryIdOf } from '@/features/categories/lib/category-ref';
import { useEntry, useUpdateEntry } from '@/features/entries/hooks/use-entries';
import { useCurrency } from '@/features/profile/hooks/use-profile';

// Category picker for a saved entry; saves the choice and returns.
export default function SelectCategoryRoute() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const currency = useCurrency();
  const { data: entry } = useEntry(entryId);
  const updateEntry = useUpdateEntry();
  if (!entry) return null;

  return (
    <CategoryPickerScreen
      initialId={categoryIdOf(entry)}
      kind={entry.kind}
      amount={Number(entry.amount)}
      currency={currency}
      onConfirm={(categoryId) => {
        updateEntry.mutate({ id: entryId, patch: categoryColumns(categoryId) });
        router.back();
      }}
    />
  );
}

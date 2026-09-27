import { router, useLocalSearchParams } from 'expo-router';

import { useCaptureStore } from '@/features/capture/data/capture-store';
import { CategoryPickerScreen } from '@/features/categories/components/category-picker-screen';
import { categoryColumns, categoryIdOf } from '@/features/categories/lib/category-ref';
import { useEntry, useUpdateEntry } from '@/features/entries/hooks/use-entries';
import { useCurrency } from '@/features/profile/hooks/use-profile';

// Category picker for either a saved entry (entryId) or a capture draft
// (draftId); writes the choice to the matching place and returns.
export default function SelectCategoryRoute() {
  const { entryId, draftId } = useLocalSearchParams<{ entryId?: string; draftId?: string }>();
  const currency = useCurrency();
  const { data: entry } = useEntry(entryId ?? '');
  const draft = useCaptureStore((state) =>
    state.drafts.find((candidate) => candidate.id === draftId),
  );
  const updateDraft = useCaptureStore((state) => state.updateDraft);
  const updateEntry = useUpdateEntry();

  const initialId = (entry && categoryIdOf(entry)) ?? draft?.categoryId ?? null;
  const amount = Number(entry?.amount ?? draft?.amount ?? 0);
  if (entryId && !entry) return null;

  return (
    <CategoryPickerScreen
      initialId={initialId}
      amount={amount}
      currency={currency}
      onConfirm={(categoryId) => {
        if (entryId) updateEntry.mutate({ id: entryId, patch: categoryColumns(categoryId) });
        if (draftId) updateDraft(draftId, { categoryId, uncertain: false });
        router.back();
      }}
    />
  );
}

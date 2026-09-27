import { router, useLocalSearchParams } from 'expo-router';

import { useCaptureStore } from '@/features/capture/data/capture-store';
import { CategoryPickerScreen } from '@/features/categories/components/category-picker-screen';
import { useAddSuggestedCategories } from '@/features/categories/hooks/use-add-suggested-categories';
import { useEntry, useUpdateEntry } from '@/features/entries/hooks/use-entries';
import { useCurrency } from '@/features/profile/hooks/use-profile';

// Category picker for either a saved entry (entryId) or a capture draft
// (draftId); writes the choice to the matching place and returns. A preset
// the user doesn't have yet is added to their categories first.
export default function SelectCategoryRoute() {
  const { entryId, draftId } = useLocalSearchParams<{ entryId?: string; draftId?: string }>();
  const currency = useCurrency();
  const { data: entry } = useEntry(entryId ?? '');
  const addSuggestedCategories = useAddSuggestedCategories();
  const draft = useCaptureStore((state) =>
    state.drafts.find((candidate) => candidate.id === draftId),
  );
  const updateDraft = useCaptureStore((state) => state.updateDraft);
  const updateEntry = useUpdateEntry();

  const initialId = entry?.category_id ?? draft?.categoryId ?? null;
  const amount = Number(entry?.amount ?? draft?.amount ?? 0);
  if (entryId && !entry) return null;

  return (
    <CategoryPickerScreen
      initialId={initialId}
      amount={amount}
      currency={currency}
      onConfirm={async (category) => {
        // The entry points at the category, so it has to exist first. A
        // failed insert already shows the "not saved" alert; stay here.
        const added = await addSuggestedCategories([category.id]).catch(() => null);
        if (!added) return;
        const categoryId = added.get(category.id) ?? category.id;
        if (entryId) updateEntry.mutate({ id: entryId, patch: { category_id: categoryId } });
        if (draftId) updateDraft(draftId, { categoryId, uncertain: false });
        router.back();
      }}
    />
  );
}

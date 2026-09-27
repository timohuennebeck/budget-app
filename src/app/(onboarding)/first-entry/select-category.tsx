import { router, useLocalSearchParams } from 'expo-router';

import { useCaptureStore } from '@/features/capture/data/capture-store';
import { useCaptureContext } from '@/features/capture/hooks/use-capture-context';
import { CategoryPickerScreen } from '@/features/categories/components/category-picker-screen';

// Category picker for a draft during onboarding (no saved entries yet).
export default function FirstEntrySelectCategory() {
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const { currency } = useCaptureContext('onboarding');
  const draft = useCaptureStore((state) => state.drafts.find((item) => item.id === draftId));
  const updateDraft = useCaptureStore((state) => state.updateDraft);
  if (!draft) return null;

  return (
    <CategoryPickerScreen
      initialId={draft.categoryId}
      kind={draft.kind}
      amount={draft.amount}
      currency={currency}
      onConfirm={(categoryId) => {
        updateDraft(draft.id, { categoryId, uncertain: false });
        router.back();
      }}
    />
  );
}

import { router, useLocalSearchParams } from 'expo-router';

import { CategoryPickerScreen } from '@/features/categories/components/category-picker-screen';

import { type CaptureMode, useCaptureStore } from '../data/capture-store';
import { useCaptureContext } from '../hooks/use-capture-context';

/** Category picker for a capture draft (?draftId=); confirming also clears "unsure". */
export function DraftCategoryScreen({ mode }: { mode: CaptureMode }) {
  const { draftId } = useLocalSearchParams<{ draftId: string }>();
  const { currency } = useCaptureContext(mode);
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

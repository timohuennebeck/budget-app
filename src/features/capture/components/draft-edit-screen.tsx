import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EntryEditor } from '@/features/entries/components/entry-editor';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { Button } from '@/shared/ui/button';

import { useCaptureStore } from '../data/capture-store';
import { useCaptureCategories } from '../hooks/use-capture-categories';
import { useCaptureContext } from '../hooks/use-capture-context';

/** Corrects a parsed entry before it is saved (tap on a review row). */
export function DraftEditScreen({ id }: { id: string }) {
  const { t } = useTranslation();
  const { currency } = useCaptureContext('app');
  const categories = useCaptureCategories('app');
  const stored = useCaptureStore((state) => state.drafts.find((draft) => draft.id === id));
  const updateDraft = useCaptureStore((state) => state.updateDraft);
  const removeDraft = useCaptureStore((state) => state.removeDraft);
  const [draft, setDraft] = useState(stored);

  if (!draft) return null;
  const category = categories.find((option) => option.id === stored?.categoryId);

  return (
    <Screen
      scroll
      footer={
        <View>
          <Button
            label={t('common.save')}
            haptic="success"
            onPress={() => {
              updateDraft(id, {
                ...draft,
                categoryId: stored?.categoryId ?? null,
                uncertain: false,
              });
              router.back();
            }}
          />
          <Button
            variant="ghost"
            className="mt-2.5"
            label={t('capture.removeDraft')}
            haptic="warning"
            onPress={() => {
              removeDraft(id);
              router.back();
            }}
          />
        </View>
      }>
      <ScreenHeader title={t('entries.entry')} />
      <EntryEditor
        value={draft}
        category={category}
        currency={currency}
        onChange={(patch) => setDraft({ ...draft, ...patch })}
        onCategoryPress={() =>
          router.push({ pathname: '/select-category', params: { draftId: id } })
        }
      />
    </Screen>
  );
}

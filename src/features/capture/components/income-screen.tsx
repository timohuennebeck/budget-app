import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { categoryColumns } from '@/features/categories/lib/category-ref';
import { EntryEditor } from '@/features/entries/components/entry-editor';
import { useCreateEntries } from '@/features/entries/hooks/use-entries';
import { useEntriesAllowance } from '@/features/paywall/hooks/use-entries-allowance';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

import { useCaptureStore } from '../data/capture-store';
import { useCaptureCategories } from '../hooks/use-capture-categories';
import { useCaptureContext } from '../hooks/use-capture-context';
import { captureHref } from '../lib/capture-routes';

// "Was kam rein?": logs money the user received (salary, a refund, a sale)
// by hand. The entry lives as the only draft of a capture session, so the
// category picker and the saved screen work as for parsed entries.
export function IncomeScreen() {
  const { t } = useTranslation();
  const { currency } = useCaptureContext('app');
  const categories = useCaptureCategories('app');
  const draft = useCaptureStore((state) => state.drafts[0]);
  const updateDraft = useCaptureStore((state) => state.updateDraft);
  const createEntries = useCreateEntries();
  const allowance = useEntriesAllowance();

  useEffect(() => {
    const store = useCaptureStore.getState();
    store.start();
    store.addDrafts([
      {
        id: randomUUID(),
        title: '',
        amount: 0,
        kind: 'income',
        categoryId: 'salary',
        source: 'manual',
        occurredAt: new Date().toISOString(),
        uncertain: false,
      },
    ]);
  }, []);

  if (!draft) return null;
  const category = categories.find((option) => option.id === draft.categoryId);

  const save = () => {
    if (!allowance.canAdd()) {
      router.push('/limit');
      return;
    }
    const title = draft.title.trim() || category?.name || t('entries.income');
    updateDraft(draft.id, { title });
    createEntries
      .mutateAsync([
        {
          id: randomUUID(),
          title,
          amount: draft.amount,
          kind: 'income',
          ...categoryColumns(draft.categoryId),
          source: 'manual',
          capture_id: null,
          occurred_at: draft.occurredAt,
        },
      ])
      .catch(() => {});
    router.replace(captureHref('app', 'saved'));
  };

  return (
    <Screen
      scroll
      footer={
        <Button
          label={t('income.save')}
          disabled={draft.amount <= 0}
          haptic="success"
          onPress={save}
        />
      }>
      <ScreenHeader leading="close" />
      <Text variant="display" className="mt-[22px]">
        {t('income.title')}
      </Text>
      <Text variant="body" className="mt-2.5">
        {t('income.subtitle')}
      </Text>
      <EntryEditor
        value={draft}
        category={category}
        currency={currency}
        onChange={(patch) => updateDraft(draft.id, patch)}
        onCategoryPress={() =>
          router.push({ pathname: '/capture/select-category', params: { draftId: draft.id } })
        }
      />
    </Screen>
  );
}

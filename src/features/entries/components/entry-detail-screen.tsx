import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCategoryLookup } from '@/features/categories/hooks/use-category-lookup';
import { useCurrency } from '@/features/profile/hooks/use-profile';
import { ConfirmSheet } from '@/shared/components/confirm-sheet';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { useSheet } from '@/shared/components/sheet';
import { haptics } from '@/shared/lib/haptics';
import { Button } from '@/shared/ui/button';

import type { Entry } from '../data/entries-api';
import { useDeleteEntry, useEntry, useUpdateEntry } from '../hooks/use-entries';
import { entryAmount } from '../lib/entry-display';
import { type EditableEntry, EntryEditor } from './entry-editor';

// Eintragsdetail (2y) with delete confirmation sheet (2y2).
export function EntryDetailScreen({ id }: { id: string }) {
  const { data: entry } = useEntry(id);
  return entry ? <EntryDetailForm entry={entry} /> : null;
}

function EntryDetailForm({ entry }: { entry: Entry }) {
  const { t } = useTranslation();
  const lookup = useCategoryLookup();
  const update = useUpdateEntry();
  const remove = useDeleteEntry();
  const confirm = useSheet();
  const id = entry.id;
  const currency = useCurrency();
  const [draft, setDraft] = useState<EditableEntry>(() => ({
    title: entry.title,
    amount: Number(entry.amount),
    totalAmount: entry.total_amount === null ? null : Number(entry.total_amount),
    kind: entry.kind,
    categoryId: entry.category_id,
    occurredAt: entry.occurred_at,
  }));

  const save = () => {
    update.mutate({
      id,
      patch: {
        title: draft.title.trim() || entry.title,
        amount: draft.amount,
        total_amount: draft.totalAmount,
        occurred_at: draft.occurredAt,
      },
    });
    haptics.success();
    router.back();
  };

  const destroy = () => {
    confirm.dismiss();
    router.back();
    remove.mutate(id);
  };

  return (
    <Screen
      scroll
      footer={
        <View>
          <Button label={t('common.save')} onPress={save} />
          <Button
            variant="ghost-danger"
            className="mt-2.5"
            label={t('entries.delete')}
            haptic="warning"
            onPress={confirm.present}
          />
        </View>
      }>
      <ScreenHeader title={t('entries.entry')} />
      <EntryEditor
        value={{ ...draft, categoryId: entry.category_id }}
        category={entry.category_id ? lookup.get(entry.category_id) : undefined}
        currency={currency}
        onChange={(patch) => setDraft({ ...draft, ...patch })}
        onCategoryPress={() =>
          router.push({ pathname: '/select-category', params: { entryId: id } })
        }
      />
      <ConfirmSheet
        {...confirm.controls}
        destructive
        title={t('entries.deleteTitle')}
        message={t('entries.deleteMessage', {
          title: entry.title,
          amount: entryAmount(entry, currency),
        })}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={destroy}
      />
    </Screen>
  );
}

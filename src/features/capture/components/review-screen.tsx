import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EntryRow } from '@/features/entries/components/entry-row';
import { useCreateEntries } from '@/features/entries/hooks/use-entries';
import { entryAmount, entrySubtitle, entryVisual } from '@/features/entries/lib/entry-display';
import { useEntryAllowance } from '@/features/paywall/hooks/use-entry-allowance';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { formatShortDate } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

import { useCaptureStore } from '../data/capture-store';
import { useCaptureCategories } from '../hooks/use-capture-categories';
import { useCaptureContext } from '../hooks/use-capture-context';
import { captureHref } from '../lib/capture-routes';
import { draftsTotal } from '../lib/parse-entries';
import type { DraftEntry } from '../lib/types';

// "Passt alles?" (2xe2): parsed drafts before saving. Rows Pip wasn't sure
// about are highlighted with a quick confirm / edit choice.
export function ReviewScreen() {
  const { t } = useTranslation();
  const { currency } = useCaptureContext('app');
  const drafts = useCaptureStore((state) => state.drafts);
  const updateDraft = useCaptureStore((state) => state.updateDraft);
  const appendMore = useCaptureStore((state) => state.appendMore);
  const categories = useCaptureCategories('app');
  const createEntries = useCreateEntries();
  const allowance = useEntryAllowance();

  const categoryFor = (draft: DraftEntry) =>
    categories.find((category) => category.id === draft.categoryId);
  const edit = (draft: DraftEntry) =>
    router.push({ pathname: '/capture/edit/[id]', params: { id: draft.id } });
  const pickCategory = (draft: DraftEntry) =>
    router.push({ pathname: '/select-category', params: { draftId: draft.id } });

  const save = () => {
    if (!allowance.canAdd(drafts.length)) {
      router.push('/limit');
      return;
    }
    createEntries.mutate(
      drafts.map((draft) => ({
        title: draft.title,
        amount: draft.amount,
        total_amount: draft.totalAmount,
        kind: draft.kind,
        category_id: draft.categoryId,
        source: draft.source,
        occurred_at: draft.occurredAt,
      })),
      { onSuccess: () => router.replace(captureHref('app', 'saved')) },
    );
  };

  return (
    <Screen
      scroll
      footer={
        <View>
          <Button
            label={t('capture.saveEntries', { count: drafts.length })}
            disabled={drafts.length === 0}
            loading={createEntries.isPending}
            haptic="success"
            onPress={save}
          />
          <Button
            variant="ghost"
            className="mt-1"
            label={t('capture.addMore')}
            onPress={() => {
              appendMore();
              // Back to the text screen below instead of stacking a second one
              // (whose × would then only reveal the first).
              router.dismissTo(captureHref('app', 'index'));
            }}
          />
        </View>
      }>
      <ScreenHeader
        leading="close"
        trailing={
          <Text size={15} className="text-muted-soft">
            {formatShortDate(new Date())}
          </Text>
        }
      />
      <Text variant="display" className="mt-[22px]">
        {t('capture.reviewTitle')}
      </Text>
      <Text variant="body" className="mt-2.5">
        {t('capture.reviewSubtitle')}
      </Text>

      <Card className="mt-3.5 py-1">
        {drafts.map((draft) => {
          const category = categoryFor(draft);
          const visual = entryVisual(draft.kind, category);
          const amount = entryAmount(draft, currency);
          const original = draft.totalAmount
            ? formatMoney(draft.totalAmount, { currency })
            : undefined;

          if (!draft.uncertain) {
            return (
              <EntryRow
                key={draft.id}
                {...visual}
                title={draft.title}
                subtitle={entrySubtitle(
                  { ...draft, total_amount: draft.totalAmount },
                  category?.name,
                )}
                amount={amount}
                originalAmount={original}
                chevron
                onPress={() => edit(draft)}
              />
            );
          }

          return (
            <View
              key={draft.id}
              className="mx-2 mt-1 mb-2 rounded-[18px] bg-[#EEF4FF] px-2 pt-2 pb-3">
              <EntryRow
                {...visual}
                className="px-0 py-0"
                title={draft.title}
                amount={amount}
                subtitle={
                  <View className="flex-row items-center gap-[5px]">
                    <Icon name="sparkle" weight="fill" size={13} color={colors.primary} />
                    <Text size={13.5} className="text-muted">
                      {category
                        ? t('capture.guess', { name: category.name })
                        : t('capture.whichCategory')}
                    </Text>
                  </View>
                }
              />
              <View className="mt-2.5 flex-row gap-2 pl-14">
                <Button
                  size="sm"
                  icon="check"
                  className="h-9 flex-1"
                  label={t('capture.confirm')}
                  disabled={!category}
                  onPress={() => updateDraft(draft.id, { uncertain: false })}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 flex-1"
                  label={t('common.edit')}
                  onPress={() => pickCategory(draft)}
                />
              </View>
            </View>
          );
        })}
      </Card>
      <View className="mt-3.5 flex-row justify-between px-1">
        <Text size={15} className="text-muted">
          {t('capture.total')}
        </Text>
        <Text size={15} weight="semibold">
          {formatMoney(-draftsTotal(drafts), { currency })}
        </Text>
      </View>
    </Screen>
  );
}

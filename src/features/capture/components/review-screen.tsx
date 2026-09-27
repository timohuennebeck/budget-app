import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { categoryColumns } from '@/features/categories/lib/category-ref';
import { EntryRow } from '@/features/entries/components/entry-row';
import { useCreateEntries } from '@/features/entries/hooks/use-entries';
import { entryAmount, entrySubtitle, entryVisual } from '@/features/entries/lib/entry-display';
import { useEntriesAllowance } from '@/features/paywall/hooks/use-entries-allowance';
import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { removePayments } from '@/features/wallet/lib/wallet-inbox';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { formatDayLabel } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

import { type CaptureMode, useCaptureStore } from '../data/capture-store';
import { useCaptureCategories } from '../hooks/use-capture-categories';
import { useCaptureContext } from '../hooks/use-capture-context';
import { captureHref } from '../lib/capture-routes';
import { draftsTotal } from '../lib/parse-entries';
import type { DraftEntry } from '../lib/types';
import { TodayLabel } from './today-label';

// "Passt alles?" (2xe2): parsed drafts before saving. Rows Pip wasn't sure
// about are highlighted with a quick confirm / edit choice.
export function ReviewScreen({ mode = 'app' }: { mode?: CaptureMode }) {
  const { t } = useTranslation();
  const { currency } = useCaptureContext(mode);
  const drafts = useCaptureStore((state) => state.drafts);
  const updateDraft = useCaptureStore((state) => state.updateDraft);
  const appendMore = useCaptureStore((state) => state.appendMore);
  const categories = useCaptureCategories(mode);
  const createEntries = useCreateEntries();
  const allowance = useEntriesAllowance();

  const categoryFor = (draft: DraftEntry) =>
    categories.find((category) => category.id === draft.categoryId);
  const edit = (draft: DraftEntry) =>
    router.push({
      pathname: mode === 'onboarding' ? '/first-entry/edit/[id]' : '/capture/edit/[id]',
      params: { id: draft.id },
    });
  const pickCategory = (draft: DraftEntry) =>
    router.push({
      pathname: mode === 'onboarding' ? '/first-entry/select-category' : '/capture/select-category',
      params: { draftId: draft.id },
    });

  const save = () => {
    // Onboarding keeps the entries until the account exists (saved at sign-up).
    if (mode === 'onboarding') {
      useOnboardingStore.getState().addEntries(drafts);
      router.replace(captureHref(mode, 'saved'));
      return;
    }
    if (!allowance.canAdd(drafts.length)) {
      router.push('/limit');
      return;
    }
    const paymentIds = drafts.flatMap((draft) => draft.paymentId ?? []);
    createEntries
      .mutateAsync(
        drafts.map((draft) => ({
          id: randomUUID(),
          title: draft.title,
          amount: draft.amount,
          kind: draft.kind,
          ...categoryColumns(draft.categoryId),
          source: draft.source,
          capture_id: draft.captureId ?? null,
          occurred_at: draft.occurredAt,
        })),
      )
      // Apple Pay payments leave the inbox only once they're really saved.
      .then(() => removePayments(paymentIds))
      .catch(() => {});
    router.replace(captureHref('app', 'saved'));
  };

  return (
    <Screen
      scroll
      footer={
        <View>
          <Button
            label={t('capture.saveEntries', { count: drafts.length })}
            disabled={drafts.length === 0}
            haptic="success"
            onPress={save}
          />
          <Button
            variant="ghost"
            className="mt-2.5"
            label={t('capture.addMore')}
            onPress={() => {
              appendMore();
              // Back to the text screen below instead of stacking a second one
              // (whose × would then only reveal the first).
              router.dismissTo(captureHref(mode, 'index'));
            }}
          />
        </View>
      }>
      <ScreenHeader leading="close" trailing={<TodayLabel />} />
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

          if (!draft.uncertain) {
            return (
              <EntryRow
                key={draft.id}
                {...visual}
                title={draft.title}
                subtitle={`${entrySubtitle(draft, category?.name)} · ${formatDayLabel(new Date(draft.occurredAt))}`}
                amount={amount}
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

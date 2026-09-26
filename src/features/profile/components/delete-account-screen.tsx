import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useDeleteAccount } from '@/features/auth/hooks/use-auth-actions';
import { useCategories } from '@/features/categories/hooks/use-categories';
import { useEntryDates } from '@/features/entries/hooks/use-entries';
import { streakDays } from '@/features/entries/lib/entry-stats';
import { cancelReminders } from '@/features/reminders/lib/reminders';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { StatusHero } from '@/shared/components/status-hero';
import { haptics } from '@/shared/lib/haptics';
import { Button } from '@/shared/ui/button';
import { InfoBadge } from '@/shared/ui/info-badge';
import { Text } from '@/shared/ui/text';

import { useProfile } from '../hooks/use-profile';

/** Konto löschen (2k): lists what will be lost before deleting everything. */
export function DeleteAccountScreen() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const { data: dates = [] } = useEntryDates();
  const { data: categories = [] } = useCategories();
  const deleteAccount = useDeleteAccount();

  const confirm = () =>
    deleteAccount.mutate(undefined, {
      onSuccess: () => {
        haptics.success();
        cancelReminders();
      },
      onError: () => haptics.error(),
    });

  return (
    <Screen
      gradient="mist"
      gradientHeight={440}
      footer={
        <View>
          <Button
            label={t('profile.deleteConfirm')}
            haptic="warning"
            loading={deleteAccount.isPending}
            onPress={confirm}
          />
          <Button
            variant="ghost"
            className="mt-2.5"
            label={t('profile.keepAccount')}
            onPress={() => router.back()}
          />
        </View>
      }>
      <ScreenHeader title={t('profile.deleteAccount')} />
      <StatusHero
        className="mt-6"
        pose="magnifier"
        pipSize={212}
        title={t('profile.deleteTitle', { name: profile?.first_name ?? '' })}
        subtitle={t('profile.deleteSubtitle', {
          entries: dates.length,
          streak: streakDays(dates),
          categories: categories.length,
        })}
      />
      {profile?.plan === 'plus' ? (
        <View className="mt-[22px] flex-row items-start gap-[11px] rounded-[20px] bg-primary-tint px-4 py-3.5">
          <InfoBadge variant="solid" />
          <Text size={14} leading={1.45} className="flex-1 text-ink-soft">
            {t('profile.deletePlusNote')}
          </Text>
        </View>
      ) : null}
    </Screen>
  );
}

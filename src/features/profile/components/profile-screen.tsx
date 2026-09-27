import { router } from 'expo-router';
import { Linking, Platform, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useAuth } from '@/features/auth/lib/auth-provider';
import { useAppCategoryDisplays } from '@/features/categories/hooks/use-category-display';
import { useNotificationSettings } from '@/features/notifications/hooks/use-notification-settings';
import { useEntriesAllowance } from '@/features/paywall/hooks/use-entries-allowance';
import { ListGroup, ListRow } from '@/shared/components/list-group';
import { Screen } from '@/shared/components/screen';
import { useSheet } from '@/shared/components/sheet';
import { findLanguage } from '@/shared/data/languages';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { formatMoney } from '@/shared/lib/money';
import { InitialAvatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

import { useProfile, useUpdateProfile } from '../hooks/use-profile';
import { MonthStartSheet } from './month-start-sheet';

// Profil (3g): account header and grouped settings linking to the detail
// screens (budget, categories, reminder, language, legal, delete, logout).
export function ProfileScreen() {
  const { t } = useTranslation();
  const { session } = useAuth();
  const { data: profile } = useProfile();
  const categories = useAppCategoryDisplays();
  const updateProfile = useUpdateProfile();
  const allowance = useEntriesAllowance();
  const { data: settings } = useNotificationSettings();
  const reminder = settings?.find((row) => row.kind === 'daily_reminder');
  const { supportEmail } = useAppConfig();
  const monthStart = useSheet();

  if (!profile) return null;
  const currency = profile.currency;

  return (
    <Screen scroll tabBar>
      <View className="h-[34px] items-center justify-center">
        <Text size={15} weight="semibold">
          {t('tabs.profile')}
        </Text>
      </View>
      <View className="mt-4 flex-row items-center gap-3.5">
        <InitialAvatar name={profile.first_name} />
        <View className="gap-0.5">
          <Text size={26} weight="semibold" tracking={-0.025}>
            {profile.first_name}
          </Text>
          <Text size={14.5} className="text-muted-soft">
            {session?.user.email}
          </Text>
        </View>
      </View>

      <ListGroup className="mt-[22px]" title={t('profile.spending')}>
        <ListRow
          title={t('profile.monthlyBudget')}
          value={
            profile.monthly_budget === null
              ? t('budgets.noLimit')
              : formatMoney(Number(profile.monthly_budget), { currency, compact: true })
          }
          onPress={() => router.push('/settings/monthly-budget')}
        />
        <ListRow
          title={t('profile.categories')}
          value={String(categories.length)}
          onPress={() => router.push('/settings/budgets')}
        />
        <ListRow
          title={t('profile.monthStart')}
          value={`${profile.month_start_day}.`}
          onPress={monthStart.present}
        />
        <ListRow
          title={t('profile.currency')}
          value={currency}
          onPress={() => router.push('/settings/currency')}
        />
      </ListGroup>

      <ListGroup className="mt-[22px]" title={t('profile.app')}>
        <ListRow
          title={t('profile.reminder')}
          subtitle={
            reminder?.enabled && reminder.time
              ? t(
                  reminder.repeat === 'weekdays'
                    ? 'profile.reminderWeekdays'
                    : 'profile.reminderDaily',
                  { time: reminder.time.slice(0, 5) },
                )
              : t('profile.reminderOff')
          }
          onPress={() => router.push('/settings/reminder')}
        />
        <ListRow
          title={t('profile.actionButton')}
          onPress={() => router.push('/settings/action-button')}
        />
        {Platform.OS === 'android' ? null : (
          <ListRow
            title={t('profile.applePay')}
            onPress={() => router.push('/settings/apple-pay')}
          />
        )}
        <ListRow
          title={t('profile.language')}
          value={findLanguage(profile.locale).name}
          onPress={() => router.push('/settings/language')}
        />
      </ListGroup>

      <ListGroup className="mt-[22px]" title={t('profile.account')}>
        <ListRow
          title="Looop Plus"
          subtitle={
            allowance.unlimited
              ? t('profile.plusActive')
              : t('profile.entriesLeft', { count: allowance.remaining, limit: allowance.limit })
          }
          accessory={
            allowance.unlimited ? null : (
              <View className="rounded-full bg-primary px-2.5 py-1">
                <Text size={12.5} weight="semibold" className="text-white">
                  {t('profile.upgrade')}
                </Text>
              </View>
            )
          }
          onPress={() => router.push('/paywall')}
        />
        <ListRow
          title={t('profile.help')}
          onPress={() => Linking.openURL(`mailto:${supportEmail}`)}
        />
        <ListRow title={t('legal.terms')} onPress={() => router.push('/legal/terms')} />
        <ListRow title={t('legal.privacy')} onPress={() => router.push('/legal/privacy')} />
        <ListRow
          title={t('profile.deleteAccount')}
          destructive
          onPress={() => router.push('/settings/delete-account')}
        />
      </ListGroup>

      <Button
        variant="link"
        className="mt-3"
        label={t('profile.signOut')}
        onPress={() => router.push('/settings/logout')}
      />

      <MonthStartSheet
        {...monthStart.controls}
        value={profile.month_start_day}
        onSave={(day) => {
          updateProfile.mutate({ month_start_day: day });
          monthStart.dismiss();
        }}
      />
    </Screen>
  );
}

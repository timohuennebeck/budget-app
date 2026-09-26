import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useProfile, useUpdateProfile } from '@/features/profile/hooks/use-profile';
import { ReminderScreen } from '@/features/reminders/components/reminder-screen';
import {
  requestNotificationPermission,
  scheduleReminder,
} from '@/features/reminders/lib/reminders';
import { ScreenHeader } from '@/shared/components/screen-header';

export default function ReminderSettings() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  if (!profile) return null;

  return (
    <ReminderScreen
      header={<ScreenHeader title={t('profile.reminder')} />}
      title={t('reminders.title')}
      initial={{ time: profile.reminder_time.slice(0, 5), repeat: profile.reminder_repeat }}
      submitLabel={() => t('common.save')}
      loading={update.isPending}
      onSubmit={async ({ time, repeat }) => {
        const granted = await requestNotificationPermission();
        if (granted) await scheduleReminder(time, repeat);
        update.mutate(
          { reminder_time: time, reminder_repeat: repeat, reminder_enabled: granted },
          { onSuccess: () => router.back() },
        );
      }}
    />
  );
}

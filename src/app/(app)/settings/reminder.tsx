import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ReminderScreen } from '@/features/notifications/components/reminder-screen';
import { useEnsureNotificationPermission } from '@/features/notifications/hooks/use-enable-notifications';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '@/features/notifications/hooks/use-notification-settings';
import {
  isGroupEnabled,
  type NotificationGroup,
  notificationGroups,
} from '@/features/notifications/lib/groups';
import { ListGroup, ListSwitchRow } from '@/shared/components/list-group';
import { ScreenHeader } from '@/shared/components/screen-header';

export default function ReminderSettings() {
  const { t } = useTranslation();
  const { data: settings } = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const ensurePermission = useEnsureNotificationPermission();
  const daily = settings?.find((row) => row.kind === 'daily_reminder');
  if (!settings || !daily) return null;

  const isOn = (group: NotificationGroup) => isGroupEnabled(settings, group);
  const toggle = async (group: NotificationGroup, enabled: boolean) => {
    if (enabled && !(await ensurePermission())) return;
    update.mutate({ kinds: notificationGroups[group], patch: { enabled } });
  };

  return (
    <ReminderScreen
      header={<ScreenHeader title={t('profile.reminder')} />}
      title={t('reminders.title')}
      initial={{ time: daily.time!.slice(0, 5), repeat: daily.repeat! }}
      submitLabel={() => t('common.save')}
      onSubmit={async ({ time, repeat }) => {
        const enabled = await ensurePermission();
        update.mutate({
          kinds: notificationGroups.dailyReminder,
          patch: { time, repeat, enabled },
        });
        if (enabled) router.back();
      }}>
      <ListGroup className="mt-6" title={t('reminders.notifications')}>
        <ListSwitchRow
          title={t('reminders.dailyReminder')}
          value={isOn('dailyReminder')}
          onValueChange={(value) => toggle('dailyReminder', value)}
        />
        <ListSwitchRow
          title={t('reminders.checkIn')}
          subtitle={t('reminders.checkInHint')}
          value={isOn('checkIn')}
          onValueChange={(value) => toggle('checkIn', value)}
        />
        <ListSwitchRow
          title={t('reminders.budgetWarnings')}
          subtitle={t('reminders.budgetWarningsHint')}
          value={isOn('budgetWarnings')}
          onValueChange={(value) => toggle('budgetWarnings', value)}
        />
      </ListGroup>
    </ReminderScreen>
  );
}

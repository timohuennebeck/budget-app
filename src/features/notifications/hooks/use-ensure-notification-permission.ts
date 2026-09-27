import { Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

import { registerDevice, requestNotificationPermission } from '../lib/push';

/**
 * Asks for permission before a notification is switched on; if the user
 * declined earlier, points them to the system settings instead.
 */
export function useEnsureNotificationPermission() {
  const { t } = useTranslation();
  return async () => {
    if (await requestNotificationPermission()) {
      registerDevice();
      return true;
    }
    Alert.alert(t('reminders.permissionTitle'), t('reminders.permissionMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.openSettings'), onPress: () => Linking.openSettings() },
    ]);
    return false;
  };
}

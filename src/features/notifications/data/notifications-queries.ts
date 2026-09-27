import { createQueryKeys } from '@lukemorales/query-key-factory';

import { fetchNotificationSettings } from './notifications-api';

export const notificationQueries = createQueryKeys('notifications', {
  settings: { queryKey: null, queryFn: fetchNotificationSettings },
});

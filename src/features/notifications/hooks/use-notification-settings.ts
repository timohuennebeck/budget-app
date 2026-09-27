import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { restore, snapshot } from '@/shared/lib/optimistic';

import {
  type NotificationKind,
  type NotificationSetting,
  type NotificationSettingPatch,
  updateNotificationSettings,
} from '../data/notifications-api';
import { notificationQueries } from '../data/notifications-queries';

const settingsKey = notificationQueries.settings.queryKey;

export function useNotificationSettings() {
  return useQuery(notificationQueries.settings);
}

interface SettingsChange {
  kinds: readonly NotificationKind[];
  patch: NotificationSettingPatch;
}

export function useUpdateNotificationSettings() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ kinds, patch }: SettingsChange) => updateNotificationSettings([...kinds], patch),
    meta: { optimistic: true },
    onMutate: async ({ kinds, patch }) => {
      const saved = await snapshot(client, { queryKey: settingsKey });
      client.setQueryData<NotificationSetting[]>(settingsKey, (rows) =>
        rows?.map((row) => (kinds.includes(row.kind) ? { ...row, ...patch } : row)),
      );
      return { saved };
    },
    onError: (_error, _variables, context) => restore(client, context?.saved),
    onSettled: () => client.invalidateQueries({ queryKey: settingsKey }),
  });
}

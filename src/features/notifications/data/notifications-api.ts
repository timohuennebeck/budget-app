import type { Enums, Tables, TablesUpdate } from '@/shared/lib/database.types';
import { supabase } from '@/shared/lib/supabase';

export type NotificationKind = Enums<'notification_kind'>;
export type NotificationSetting = Tables<'notifications_settings'>;
export type NotificationSettingPatch = Pick<
  TablesUpdate<'notifications_settings'>,
  'enabled' | 'time' | 'repeat'
>;

// One row per kind, created with the profile.
export async function fetchNotificationSettings() {
  const { data, error } = await supabase.from('notifications_settings').select('*');
  if (error) throw error;
  return data;
}

export async function updateNotificationSettings(
  kinds: NotificationKind[],
  patch: NotificationSettingPatch,
) {
  const { error } = await supabase.from('notifications_settings').update(patch).in('kind', kinds);
  if (error) throw error;
}

/** Links this device's Expo push token to the signed-in user. */
export async function registerPushToken(token: string, platform: Enums<'platform'>) {
  const { error } = await supabase.rpc('register_push_token', {
    p_token: token,
    p_platform: platform,
  });
  if (error) throw error;
}

export async function deletePushToken(token: string) {
  const { error } = await supabase.from('push_tokens').delete().eq('token', token);
  if (error) throw error;
}

export async function markNotificationOpened(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ opened_at: new Date().toISOString() })
    .eq('id', id)
    .is('opened_at', null);
  if (error) throw error;
}

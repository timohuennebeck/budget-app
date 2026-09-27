import { HttpError, json, serve } from '../_shared/http.ts';
import { admin } from '../_shared/supabase.ts';

// Delivers queued notifications through the Expo push service. Called every
// 5 minutes by private.dispatch_notifications() (pg_cron) with the
// x-cron-secret header stored in Vault. Tokens Expo reports as unregistered
// are deleted.

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH = 100;

interface Queued {
  id: string;
  profile_id: string;
  title: string;
  content: string;
  path: string | null;
}

interface Ticket {
  status: 'ok' | 'error';
  message?: string;
  details?: { error?: string };
}

// Never throws: a network or Expo failure becomes an error ticket per
// message, so claimed rows always end up sent, failed or skipped.
async function sendBatch(messages: Record<string, unknown>[]): Promise<Ticket[]> {
  const token = Deno.env.get('EXPO_ACCESS_TOKEN');
  const failAll = (message: string) => messages.map((): Ticket => ({ status: 'error', message }));
  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(messages),
    });
    const body = (await response.json().catch(() => ({}))) as {
      data?: Ticket[];
      errors?: { message: string }[];
    };
    if (!response.ok || !body.data) {
      return failAll(body.errors?.[0]?.message ?? `expo_${response.status}`);
    }
    return body.data;
  } catch (error) {
    return failAll(error instanceof Error ? error.message.slice(0, 200) : 'expo_unreachable');
  }
}

serve(async (request) => {
  const secret = request.headers.get('x-cron-secret') ?? '';
  const { data: allowed } = await admin.rpc('is_notifications_cron_secret', { p_secret: secret });
  if (!allowed) throw new HttpError(401, 'not_allowed');

  const { data: due, error: dueError } = await admin
    .from('notifications')
    .select('id')
    .eq('status', 'queued')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for')
    .limit(500);
  if (dueError) throw dueError;
  if (!due?.length) return json({ sent: 0, failed: 0, skipped: 0 });

  // Claim the rows first so an overlapping run can't send them twice.
  const { data: claimed, error } = await admin
    .from('notifications')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .in(
      'id',
      due.map((row) => row.id),
    )
    .eq('status', 'queued')
    .select('id, profile_id, title, content, path');
  if (error) throw error;
  const queued = (claimed ?? []) as Queued[];
  if (queued.length === 0) return json({ sent: 0, failed: 0, skipped: 0 });

  const { data: tokens, error: tokensError } = await admin
    .from('push_tokens')
    .select('token, profile_id')
    .in('profile_id', [...new Set(queued.map((row) => row.profile_id))]);
  if (tokensError) throw tokensError;

  const messages: { notificationId: string; token: string; payload: Record<string, unknown> }[] =
    [];
  for (const notification of queued) {
    for (const { token, profile_id } of tokens ?? []) {
      if (profile_id !== notification.profile_id) continue;
      messages.push({
        notificationId: notification.id,
        token,
        payload: {
          to: token,
          title: notification.title,
          body: notification.content,
          sound: 'default',
          data: { path: notification.path, notification_id: notification.id },
        },
      });
    }
  }

  const delivered = new Set<string>();
  const errors = new Map<string, string>();
  const deadTokens = new Set<string>();
  for (let start = 0; start < messages.length; start += BATCH) {
    const batch = messages.slice(start, start + BATCH);
    const tickets = await sendBatch(batch.map((message) => message.payload));
    tickets.forEach((ticket, index) => {
      const { notificationId, token } = batch[index];
      if (ticket.status === 'ok') delivered.add(notificationId);
      else errors.set(notificationId, ticket.details?.error ?? ticket.message ?? 'unknown');
      if (ticket.details?.error === 'DeviceNotRegistered') deadTokens.add(token);
    });
  }

  const withToken = new Set(messages.map((message) => message.notificationId));
  const skipped = queued.filter((row) => !withToken.has(row.id)).map((row) => row.id);
  const failed = queued.filter((row) => withToken.has(row.id) && !delivered.has(row.id));

  if (skipped.length) {
    await admin
      .from('notifications')
      .update({ status: 'skipped', sent_at: null })
      .in('id', skipped);
  }
  for (const row of failed) {
    await admin
      .from('notifications')
      .update({ status: 'failed', sent_at: null, error: errors.get(row.id) ?? 'unknown' })
      .eq('id', row.id);
  }
  if (deadTokens.size)
    await admin
      .from('push_tokens')
      .delete()
      .in('token', [...deadTokens]);

  return json({ sent: delivered.size, failed: failed.length, skipped: skipped.length });
});

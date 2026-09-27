-- The parameter `secret` resolved to vault.decrypted_secrets.secret (the
-- encrypted column) instead of the argument, so the check never matched.
drop function public.is_notifications_cron_secret(text);

create function public.is_notifications_cron_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'notifications_cron_secret' and decrypted_secret = p_secret
  );
$$;

revoke execute on function public.is_notifications_cron_secret(text) from public, anon, authenticated;
grant execute on function public.is_notifications_cron_secret(text) to service_role;

-- notifications.dedupe_key -> occurrence: which day, week or budget month
-- (and category) a notification is about; one per kind and occurrence.
alter table public.notifications rename column dedupe_key to occurrence;
alter table public.notifications rename constraint notifications_profile_id_kind_dedupe_key_key
  to notifications_profile_id_kind_occurrence_key;

-- Renders the user's template (their language, English as fallback) and
-- queues it once per occurrence, if they have this kind switched on.
drop function private.queue_notification(uuid, public.notification_kind, text, jsonb);
create function private.queue_notification(
  p_profile_id uuid,
  p_kind public.notification_kind,
  p_occurrence text,
  p_vars jsonb default '{}'::jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.profiles;
  template public.notifications_templates;
  vars jsonb;
  title text;
  content text;
  placeholder record;
begin
  if not exists (
    select 1 from public.notifications_settings
    where profile_id = p_profile_id and kind = p_kind and enabled
  ) then
    return;
  end if;

  select * into profile from public.profiles where id = p_profile_id;
  select * into template from public.notifications_templates
  where kind = p_kind and locale in (profile.locale, 'en') and active
  order by locale = profile.locale desc
  limit 1;
  if not found then
    return;
  end if;

  vars := jsonb_build_object('name', profile.first_name) || p_vars;
  title := template.title;
  content := template.content;
  for placeholder in select key, value from jsonb_each_text(vars) loop
    title := replace(title, '{{' || placeholder.key || '}}', coalesce(placeholder.value, ''));
    content := replace(content, '{{' || placeholder.key || '}}', coalesce(placeholder.value, ''));
  end loop;

  insert into public.notifications (profile_id, kind, title, content, path, occurrence)
  values (p_profile_id, p_kind, title, content, template.path, p_occurrence)
  on conflict (profile_id, kind, occurrence) do nothing;
end;
$$;

-- Anonymous users (onboarding, before sign-up) get AI capture too, with a
-- smaller daily limit so throwaway accounts can't run up OpenAI costs.

insert into public.app_config (key, value, description) values
  ('ai_captures_anonymous', '5', 'AI-parsed captures per day before sign-up (anonymous users)')
on conflict (key) do nothing;

create or replace function public.claim_ai_capture(
  p_profile_id uuid,
  p_source public.entry_source,
  p_status public.capture_status,
  p_capture_id uuid default null,
  p_input_text text default null,
  p_receipt_path text default null,
  p_provider text default null,
  p_model text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed uuid;
  daily_limit integer;
begin
  perform pg_advisory_xact_lock(hashtext('captures:' || p_profile_id::text));

  -- A voice capture from transcribe-session: parse it once, soon after.
  if p_capture_id is not null
    and exists (select 1 from public.captures where id = p_capture_id and source = 'voice')
  then
    update public.captures
    set status = p_status, input_text = p_input_text
    where id = p_capture_id and profile_id = p_profile_id and status = 'pending'
      and created_at > now() - interval '15 minutes'
    returning id into claimed;
    if claimed is null then
      raise exception 'capture_already_parsed' using errcode = 'P0001';
    end if;
    return claimed;
  end if;

  select (c.value #>> '{}')::integer into daily_limit
  from public.app_config c
  where c.key = case
    when (select u.is_anonymous from auth.users u where u.id = p_profile_id)
    then 'ai_captures_anonymous'
    when (select plus_expires_at > now() from public.profiles where id = p_profile_id)
    then 'ai_captures_plus'
    else 'ai_captures_free' end;
  if (select count(*) from public.captures
      where profile_id = p_profile_id and created_at > now() - interval '24 hours')
    >= coalesce(daily_limit, 20)
  then
    raise exception 'ai_limit_reached' using errcode = 'P0001';
  end if;

  insert into public.captures
    (id, profile_id, source, status, input_text, receipt_path, provider, model)
  values (
    coalesce(p_capture_id, gen_random_uuid()), p_profile_id, p_source, p_status,
    p_input_text, p_receipt_path, p_provider, p_model
  )
  returning id into claimed;
  return claimed;
end;
$$;

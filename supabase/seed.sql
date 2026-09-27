-- Local development seed: placeholder legal documents and a demo
-- account (timo@mail.de / looop1234) filled with the entries from the design.

insert into public.legal_documents (kind, locale, version, content_md, effective_at)
select kind, locale, '2026-09-15',
  '## 1. Lorem ipsum' || chr(10) || 'Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua.' || chr(10) || chr(10) ||
  '## 2. Dolor sit amet' || chr(10) || 'At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est lorem ipsum dolor sit amet.' || chr(10) || chr(10) ||
  '## 3. Consetetur elitr' || chr(10) || 'Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis.' || chr(10) || chr(10) ||
  '## 4. Takimata sanctus' || chr(10) || 'Nam liber tempor cum soluta nobis eleifend option congue nihil imperdiet doming id quod mazim placerat facer possim assum.',
  '2026-09-15T00:00:00Z'
from unnest(array['terms', 'privacy']::public.legal_doc_kind[]) as kind,
     unnest(array['de', 'en', 'es', 'fr', 'it', 'pt', 'pt-BR']) as locale;

-- Demo user ------------------------------------------------------------------
do $$
declare
  demo_id uuid := '11111111-1111-4111-8111-111111111111';
  today timestamptz := date_trunc('day', now());
begin
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, email_change, email_change_token_new, recovery_token
  ) values (
    '00000000-0000-0000-0000-000000000000', demo_id, 'authenticated', 'authenticated',
    'timo@mail.de', extensions.crypt('looop1234', extensions.gen_salt('bf')), now(),
    '{"provider": "email", "providers": ["email"]}', '{"first_name": "Timo"}', now(), now(),
    '', '', '', ''
  );

  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (
    gen_random_uuid(), demo_id, demo_id::text,
    jsonb_build_object('sub', demo_id::text, 'email', 'timo@mail.de'),
    'email', now(), now(), now()
  );

  update public.profiles set
    budget_mode = 'per_category',
    monthly_budget = 3200,
    birth_date = '1994-09-14',
    time_zone = 'Europe/Berlin',
    onboarded_at = now()
  where id = demo_id;

  update public.notifications_settings set enabled = true
  where profile_id = demo_id and kind = 'daily_reminder';

  insert into public.categories_limits (profile_id, preset_id, amount) values
    (demo_id, 'groceries', 400),
    (demo_id, 'dining', 200),
    (demo_id, 'shopping', 150),
    (demo_id, 'cafe', 40);

  insert into public.entries (profile_id, preset_id, kind, title, amount, source, is_favorite, occurred_at) values
    (demo_id, 'drugstore', 'expense', 'dm', 23, 'voice', false, today + interval '16 hours 10 minutes'),
    (demo_id, 'dining', 'expense', 'Mittagessen', 18, 'voice', false, today + interval '13 hours 5 minutes'),
    (demo_id, 'transport', 'expense', 'Uber', 12, 'text', false, today + interval '9 hours 12 minutes'),
    (demo_id, 'groceries', 'expense', 'REWE', 40, 'text', false, today + interval '8 hours 40 minutes'),
    (demo_id, 'cafe', 'expense', 'Mein Kaffee', 1.2, 'manual', true, today - interval '1 day' + interval '8 hours'),
    (demo_id, 'transport', 'expense', 'Deutschlandticket', 58, 'manual', true, today - interval '1 day' + interval '7 hours'),
    (demo_id, 'groceries', 'expense', 'Edeka', 54.4, 'camera', false, today - interval '2 days' + interval '18 hours 22 minutes'),
    (demo_id, 'dining', 'expense', 'Freitagsmittag', 12, 'manual', true, today - interval '2 days' + interval '12 hours'),
    (demo_id, 'dining', 'expense', 'Sushi mit Lena', 36, 'text', false, today - interval '4 days' + interval '20 hours'),
    (demo_id, 'shopping', 'expense', 'Zara', 54, 'camera', false, today - interval '5 days' + interval '15 hours'),
    (demo_id, 'dining', 'expense', 'Pizza', 175, 'text', false, today - interval '6 days' + interval '19 hours'),
    (demo_id, 'cafe', 'expense', 'Flat White', 3.5, 'voice', false, today - interval '7 days' + interval '9 hours'),
    (demo_id, 'groceries', 'expense', 'Lidl', 25.6, 'text', false, today - interval '8 days' + interval '17 hours'),
    (demo_id, null, 'income', 'Freelance-Projekt', 650, 'text', false, today - interval '9 days' + interval '10 hours');
end;
$$;

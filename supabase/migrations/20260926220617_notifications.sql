-- Server-sent push notifications. Texts live in notifications_templates, each
-- user's switches in notifications_settings and their devices in
-- push_tokens. Due notifications are queued into `notifications` by pg_cron
-- and entry triggers; the send-notifications edge function delivers them
-- through the Expo push service.

create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

create type public.notification_kind as enum (
  'daily_reminder',
  'check_in_open',
  'check_in_closing',
  'budget_warning',
  'budget_exceeded',
  'limit_almost_reached'
);
create type public.notification_status as enum ('queued', 'sent', 'failed', 'skipped');

-- ---------------------------------------------------------------------------
-- Templates: title and content per kind and language
-- ---------------------------------------------------------------------------
create table public.notifications_templates (
  kind public.notification_kind not null,
  locale text not null check (locale in ('en', 'de', 'es', 'fr', 'it', 'pt', 'pt-BR')),
  -- {{name}}, {{category}}, {{percent}} and {{remaining}} are filled in when queueing
  title text not null check (char_length(title) <= 80),
  content text not null check (char_length(content) <= 240),
  -- App route opened on tap, e.g. '/check-in'
  url text null,
  active boolean not null default true,
  updated_at timestamp with time zone not null default now(),
  constraint notifications_templates_pkey primary key (kind, locale)
);

create trigger notifications_templates_updated_at before update on public.notifications_templates
for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Settings: one row per user and kind; only the daily reminder has a time
-- ---------------------------------------------------------------------------
create table public.notifications_settings (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind public.notification_kind not null,
  enabled boolean not null default true,
  time time null,
  repeat public.reminder_repeat null,
  updated_at timestamp with time zone not null default now(),
  constraint notifications_settings_pkey primary key (profile_id, kind),
  constraint notifications_settings_time_for_reminder
    check ((kind = 'daily_reminder') = (time is not null and repeat is not null))
);

create trigger notifications_settings_updated_at before update on public.notifications_settings
for each row execute function private.set_updated_at();

-- New profiles start with every kind on, except the daily reminder, which
-- the notifications step of onboarding switches on.
create or replace function private.create_notifications_settings()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.notifications_settings (profile_id, kind, enabled, time, repeat)
  select new.id, kind, kind <> 'daily_reminder',
    case when kind = 'daily_reminder' then '20:30'::time end,
    case when kind = 'daily_reminder' then 'daily'::public.reminder_repeat end
  from unnest(enum_range(null::public.notification_kind)) as kind
  on conflict do nothing;
  return new;
end;
$$;

create trigger profiles_notifications_settings after insert on public.profiles
for each row execute function private.create_notifications_settings();

-- ---------------------------------------------------------------------------
-- Push tokens: one row per device; a device moves to whoever signed in last
-- ---------------------------------------------------------------------------
create table public.push_tokens (
  token text not null check (char_length(token) <= 200),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  platform public.platform not null,
  updated_at timestamp with time zone not null default now(),
  constraint push_tokens_pkey primary key (token)
);

create index push_tokens_profile_id_idx on public.push_tokens (profile_id);

-- ---------------------------------------------------------------------------
-- Notifications: every notification queued for or sent to a user
-- ---------------------------------------------------------------------------
create table public.notifications (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind public.notification_kind not null,
  title text not null,
  content text not null,
  -- {"url": "/check-in"} plus anything the app needs on tap
  data jsonb not null default '{}'::jsonb,
  status public.notification_status not null default 'queued',
  -- One per day, week or budget month, e.g. '2026-09-28' or '<category>:2026-09-01'
  dedupe_key text not null,
  scheduled_for timestamp with time zone not null default now(),
  sent_at timestamp with time zone null,
  opened_at timestamp with time zone null,
  error text null,
  created_at timestamp with time zone not null default now(),
  constraint notifications_pkey primary key (id),
  constraint notifications_profile_id_kind_dedupe_key_key unique (profile_id, kind, dedupe_key)
);

create index notifications_queued_idx on public.notifications (scheduled_for) where status = 'queued';
create index notifications_profile_created_idx on public.notifications (profile_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Queueing
-- ---------------------------------------------------------------------------

-- Renders the user's template (their language, English as fallback) and
-- queues it once per dedupe key, if they have this kind switched on.
create or replace function private.queue_notification(
  p_profile_id uuid,
  p_kind public.notification_kind,
  p_dedupe_key text,
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

  insert into public.notifications (profile_id, kind, title, content, data, dedupe_key)
  values (
    p_profile_id, p_kind, title, content,
    jsonb_strip_nulls(jsonb_build_object('url', template.url)),
    p_dedupe_key
  )
  on conflict (profile_id, kind, dedupe_key) do nothing;
end;
$$;

-- Queues the time-based notifications that are due in each user's time zone:
-- the daily reminder (skipped when something was captured today), the
-- check-in opening Sunday 18:00 and its last call Tuesday 18:00. Runs every
-- 5 minutes; the 30-minute window plus the dedupe key make each one fire once.
create or replace function private.queue_due_notifications()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  setting record;
  local_now timestamp;
  this_week date;
begin
  for setting in
    select p.id, p.time_zone, s.kind, s.time, s.repeat
    from public.notifications_settings s
    join public.profiles p on p.id = s.profile_id
    where s.enabled and s.kind in ('daily_reminder', 'check_in_open', 'check_in_closing')
      and exists (select 1 from public.push_tokens t where t.profile_id = p.id)
  loop
    begin
      local_now := now() at time zone setting.time_zone;
    exception when invalid_parameter_value then
      local_now := now() at time zone 'UTC';
    end;
    this_week := date_trunc('week', local_now)::date;

    if setting.kind = 'daily_reminder'
      and local_now >= local_now::date + setting.time
      and local_now < local_now::date + setting.time + interval '30 minutes'
      and (setting.repeat = 'daily' or extract(isodow from local_now) < 6)
      and not exists (
        select 1 from public.entries e
        where e.profile_id = setting.id
          and e.created_at >= now() - (local_now - local_now::date::timestamp)
      )
    then
      perform private.queue_notification(setting.id, 'daily_reminder', local_now::date::text);

    elsif setting.kind = 'check_in_open'
      and extract(isodow from local_now) = 7
      and local_now::time >= '18:00' and local_now::time < '18:30'
    then
      perform private.queue_notification(setting.id, 'check_in_open', this_week::text);

    elsif setting.kind = 'check_in_closing'
      and extract(isodow from local_now) = 2
      and local_now::time >= '18:00' and local_now::time < '18:30'
      and not exists (
        select 1 from public.check_ins c
        where c.profile_id = setting.id and c.week_start = this_week - 7
      )
    then
      perform private.queue_notification(setting.id, 'check_in_closing', (this_week - 7)::text);
    end if;
  end loop;
end;
$$;

-- After each expense: warn at 80 % and 100 % of a category limit (or of the
-- monthly budget) and when only 3 free entries are left this month.
create or replace function private.queue_entry_notifications()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile public.profiles;
  current_cycle date;
  cycle_from timestamp with time zone;
  budget numeric;
  label text;
  scope text;
  spent numeric;
  spent_before numeric;
  free_limit integer;
  used_count integer;
begin
  if new.kind <> 'expense' then
    return null;
  end if;
  select * into profile from public.profiles where id = new.profile_id;
  current_cycle := private.budget_cycle_start(profile.month_start_day, profile.time_zone);
  begin
    cycle_from := current_cycle::timestamp at time zone profile.time_zone;
  exception when invalid_parameter_value then
    cycle_from := current_cycle::timestamp at time zone 'UTC';
  end;

  if profile.budget_mode = 'per_category' and new.category_id is not null then
    select c.monthly_limit, coalesce(p.names ->> profile.locale, p.names ->> 'en', c.name)
    into budget, label
    from public.categories c
    left join public.categories_presets p on p.key = c.preset_key
    where c.id = new.category_id;
    scope := new.category_id::text;
    select coalesce(sum(amount), 0) into spent from public.entries
    where profile_id = new.profile_id and category_id = new.category_id
      and kind = 'expense' and occurred_at >= cycle_from;
  elsif profile.budget_mode = 'monthly' then
    budget := profile.monthly_budget;
    label := case profile.locale
      when 'de' then 'Monatsbudget' when 'es' then 'Presupuesto mensual'
      when 'fr' then 'Budget mensuel' when 'it' then 'Budget mensile'
      when 'pt' then 'Orçamento mensal' when 'pt-BR' then 'Orçamento mensal'
      else 'Monthly budget' end;
    scope := 'monthly';
    select coalesce(sum(amount), 0) into spent from public.entries
    where profile_id = new.profile_id and kind = 'expense' and occurred_at >= cycle_from;
  end if;

  if budget > 0 and new.occurred_at >= cycle_from then
    spent_before := spent - new.amount;
    if spent_before < budget and spent >= budget then
      perform private.queue_notification(new.profile_id, 'budget_exceeded',
        scope || ':' || current_cycle, jsonb_build_object('category', label));
    elsif spent_before < budget * 0.8 and spent >= budget * 0.8 then
      perform private.queue_notification(new.profile_id, 'budget_warning',
        scope || ':' || current_cycle,
        jsonb_build_object('category', label, 'percent', floor(spent / budget * 100)));
    end if;
  end if;

  if not coalesce(profile.plus_expires_at > now(), false) then
    select (value #>> '{}')::integer into free_limit from public.app_config where key = 'free_entries';
    select a.used into used_count from public.entries_allowance a
    where a.profile_id = new.profile_id and a.cycle_start = current_cycle;
    if coalesce(free_limit, 15) - used_count = 3 then
      perform private.queue_notification(new.profile_id, 'limit_almost_reached',
        current_cycle::text, jsonb_build_object('remaining', 3));
    end if;
  end if;
  return null;
end;
$$;

create trigger entries_queue_notifications after insert on public.entries
for each row execute function private.queue_entry_notifications();

-- Queues what's due and, when anything is waiting, asks send-notifications to
-- deliver it. The project URL and cron secret live in Vault (see README).
create or replace function private.dispatch_notifications()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  cron_secret text;
begin
  perform private.queue_due_notifications();
  if not exists (select 1 from public.notifications where status = 'queued' and scheduled_for <= now()) then
    return;
  end if;
  select decrypted_secret into project_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into cron_secret from vault.decrypted_secrets where name = 'notifications_cron_secret';
  if project_url is null or cron_secret is null then
    return;
  end if;
  perform net.http_post(
    url := project_url || '/functions/v1/send-notifications',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', cron_secret),
    body := '{}'::jsonb
  );
end;
$$;

-- Lets send-notifications check the x-cron-secret header; service role only.
create or replace function public.is_notifications_cron_secret(secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets
    where name = 'notifications_cron_secret' and decrypted_secret = secret
  );
$$;

revoke execute on function public.is_notifications_cron_secret(text) from public, anon, authenticated;
grant execute on function public.is_notifications_cron_secret(text) to service_role;

-- A device's token moves to whoever signed in on it last.
create or replace function public.register_push_token(p_token text, p_platform public.platform)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  insert into public.push_tokens (token, profile_id, platform)
  values (p_token, auth.uid(), p_platform)
  on conflict (token) do update
    set profile_id = excluded.profile_id, platform = excluded.platform, updated_at = now();
end;
$$;

revoke execute on function public.register_push_token(text, public.platform) from public, anon;
grant execute on function public.register_push_token(text, public.platform) to authenticated;

select cron.schedule('dispatch-notifications', '*/5 * * * *', 'select private.dispatch_notifications()');

-- ---------------------------------------------------------------------------
-- Grants and row level security
-- ---------------------------------------------------------------------------
alter table public.notifications_templates enable row level security;
alter table public.notifications_settings enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notifications enable row level security;

revoke all on public.notifications_templates, public.notifications, public.push_tokens
  from anon, authenticated;
grant select on public.notifications_templates to authenticated;
grant select on public.notifications to authenticated;
grant update (opened_at) on public.notifications to authenticated;
grant select, delete on public.push_tokens to authenticated;

revoke insert, update, delete on public.notifications_settings from anon, authenticated;
grant update (enabled, time, repeat) on public.notifications_settings to authenticated;

create policy "Templates are readable when signed in" on public.notifications_templates
for select to authenticated using (true);

create policy "Settings are readable by their owner" on public.notifications_settings
for select to authenticated using ((select auth.uid()) = profile_id);
create policy "Settings are editable by their owner" on public.notifications_settings
for update to authenticated
using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);

create policy "Push tokens are readable by their owner" on public.push_tokens
for select to authenticated using ((select auth.uid()) = profile_id);
create policy "Push tokens are removable by their owner" on public.push_tokens
for delete to authenticated using ((select auth.uid()) = profile_id);

create policy "Notifications are readable by their owner" on public.notifications
for select to authenticated using ((select auth.uid()) = profile_id);
create policy "Notifications are marked opened by their owner" on public.notifications
for update to authenticated
using ((select auth.uid()) = profile_id) with check ((select auth.uid()) = profile_id);

-- ---------------------------------------------------------------------------
-- Starting texts
-- ---------------------------------------------------------------------------
insert into public.notifications_templates (kind, locale, title, content, url) values
  ('daily_reminder', 'en', 'Spent anything today?', 'Tell Pip in 5 seconds. Coffee, groceries, anything.', '/capture'),
  ('daily_reminder', 'de', 'Heute schon was ausgegeben?', 'Sag''s Pip in 5 Sekunden. Kaffee, Einkauf, alles.', '/capture'),
  ('daily_reminder', 'es', '¿Has gastado algo hoy?', 'Díselo a Pip en 5 segundos. Café, compra, lo que sea.', '/capture'),
  ('daily_reminder', 'fr', 'Des dépenses aujourd''hui ?', 'Dis-le à Pip en 5 secondes. Café, courses, tout.', '/capture'),
  ('daily_reminder', 'it', 'Hai speso qualcosa oggi?', 'Dillo a Pip in 5 secondi. Caffè, spesa, tutto.', '/capture'),
  ('daily_reminder', 'pt', 'Já gastaste alguma coisa hoje?', 'Diz ao Pip em 5 segundos. Café, compras, tudo.', '/capture'),
  ('daily_reminder', 'pt-BR', 'Gastou alguma coisa hoje?', 'Conta pro Pip em 5 segundos. Café, mercado, tudo.', '/capture'),

  ('check_in_open', 'en', 'Your weekly check-in is open', '{{name}}, how much did you spend this week? Guess first, then Pip shows the real number.', '/check-in'),
  ('check_in_open', 'de', 'Dein Wochen-Check-in ist offen', '{{name}}, was schätzt du für diese Woche? Danach zeigt dir Pip die echte Zahl.', '/check-in'),
  ('check_in_open', 'es', 'Tu repaso semanal está abierto', '{{name}}, ¿cuánto crees que gastaste esta semana? Luego Pip te enseña la cifra real.', '/check-in'),
  ('check_in_open', 'fr', 'Ton bilan de la semaine est ouvert', '{{name}}, combien penses-tu avoir dépensé cette semaine ? Pip te montre ensuite le vrai chiffre.', '/check-in'),
  ('check_in_open', 'it', 'Il tuo check-in settimanale è aperto', '{{name}}, quanto pensi di aver speso questa settimana? Poi Pip ti mostra la cifra vera.', '/check-in'),
  ('check_in_open', 'pt', 'O teu check-in semanal está aberto', '{{name}}, quanto achas que gastaste esta semana? Depois o Pip mostra o valor real.', '/check-in'),
  ('check_in_open', 'pt-BR', 'Seu check-in semanal está aberto', '{{name}}, quanto você acha que gastou nesta semana? Depois o Pip mostra o valor real.', '/check-in'),

  ('check_in_closing', 'en', 'Last chance for your check-in', 'This week''s check-in closes tonight. It takes 10 seconds.', '/check-in'),
  ('check_in_closing', 'de', 'Letzte Chance für deinen Check-in', 'Der Wochen-Check-in schließt heute Nacht. Dauert 10 Sekunden.', '/check-in'),
  ('check_in_closing', 'es', 'Última oportunidad para tu repaso', 'El repaso semanal cierra esta noche. Son solo 10 segundos.', '/check-in'),
  ('check_in_closing', 'fr', 'Dernière chance pour ton bilan', 'Le bilan de la semaine ferme ce soir. Ça prend 10 secondes.', '/check-in'),
  ('check_in_closing', 'it', 'Ultima occasione per il check-in', 'Il check-in settimanale chiude stanotte. Bastano 10 secondi.', '/check-in'),
  ('check_in_closing', 'pt', 'Última oportunidade para o check-in', 'O check-in semanal fecha esta noite. Demora 10 segundos.', '/check-in'),
  ('check_in_closing', 'pt-BR', 'Última chance para o check-in', 'O check-in semanal fecha hoje à noite. Leva 10 segundos.', '/check-in'),

  ('budget_warning', 'en', '{{category}}: {{percent}} % used', 'You''ve used {{percent}} % of this month''s budget. Pip is keeping an eye on it.', '/'),
  ('budget_warning', 'de', '{{category}}: {{percent}} % verbraucht', 'Du hast schon {{percent}} % deines Budgets für diesen Monat ausgegeben.', '/'),
  ('budget_warning', 'es', '{{category}}: {{percent}} % usado', 'Ya has gastado el {{percent}} % de tu presupuesto de este mes.', '/'),
  ('budget_warning', 'fr', '{{category}} : {{percent}} % utilisés', 'Tu as déjà dépensé {{percent}} % de ton budget du mois.', '/'),
  ('budget_warning', 'it', '{{category}}: {{percent}} % usato', 'Hai già speso il {{percent}} % del budget di questo mese.', '/'),
  ('budget_warning', 'pt', '{{category}}: {{percent}} % gasto', 'Já gastaste {{percent}} % do orçamento deste mês.', '/'),
  ('budget_warning', 'pt-BR', '{{category}}: {{percent}} % usado', 'Você já gastou {{percent}} % do orçamento deste mês.', '/'),

  ('budget_exceeded', 'en', '{{category}}: budget exceeded', 'You''ve gone over this month''s budget for {{category}}.', '/'),
  ('budget_exceeded', 'de', '{{category}}: Budget überschritten', 'Du bist diesen Monat über deinem Budget für {{category}}.', '/'),
  ('budget_exceeded', 'es', '{{category}}: presupuesto superado', 'Este mes has superado tu presupuesto de {{category}}.', '/'),
  ('budget_exceeded', 'fr', '{{category}} : budget dépassé', 'Tu as dépassé ton budget {{category}} ce mois-ci.', '/'),
  ('budget_exceeded', 'it', '{{category}}: budget superato', 'Questo mese hai superato il budget per {{category}}.', '/'),
  ('budget_exceeded', 'pt', '{{category}}: orçamento ultrapassado', 'Este mês ultrapassaste o orçamento de {{category}}.', '/'),
  ('budget_exceeded', 'pt-BR', '{{category}}: orçamento estourado', 'Neste mês você passou do orçamento de {{category}}.', '/'),

  ('limit_almost_reached', 'en', '{{remaining}} free entries left', 'They reset next month. With Looop Plus you capture without limits.', '/paywall'),
  ('limit_almost_reached', 'de', 'Noch {{remaining}} kostenlose Einträge', 'Nächsten Monat gibt''s neue. Mit Looop Plus erfasst du ohne Limit.', '/paywall'),
  ('limit_almost_reached', 'es', 'Te quedan {{remaining}} entradas gratis', 'Se renuevan el mes que viene. Con Looop Plus registras sin límite.', '/paywall'),
  ('limit_almost_reached', 'fr', 'Plus que {{remaining}} entrées gratuites', 'Elles reviennent le mois prochain. Avec Looop Plus, c''est sans limite.', '/paywall'),
  ('limit_almost_reached', 'it', 'Ancora {{remaining}} voci gratuite', 'Si rinnovano il mese prossimo. Con Looop Plus registri senza limiti.', '/paywall'),
  ('limit_almost_reached', 'pt', 'Faltam {{remaining}} registos gratuitos', 'Renovam-se no próximo mês. Com o Looop Plus registas sem limites.', '/paywall'),
  ('limit_almost_reached', 'pt-BR', 'Restam {{remaining}} registros grátis', 'Eles renovam no próximo mês. Com o Looop Plus você registra sem limite.', '/paywall')
on conflict (kind, locale) do nothing;

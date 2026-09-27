-- AI capture: every text, voice or receipt sent to the parse-capture edge
-- function is logged here (also the basis for the daily AI limit), and
-- receipt photos live in a private bucket under the owner's folder.

create type public.capture_status as enum ('pending', 'parsed', 'failed');

create table public.captures (
  id uuid not null default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  source public.entry_source not null check (source <> 'manual'),
  input_text text null check (char_length(input_text) <= 2000),
  -- Object name in the receipts bucket: '{profile_id}/{capture_id}.jpg'
  receipt_path text null,
  status public.capture_status not null default 'pending',
  -- Entries as returned to the app
  result jsonb null,
  error_code text null,
  provider text null,
  model text null,
  input_tokens integer null,
  output_tokens integer null,
  latency_ms integer null,
  created_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone null,
  constraint captures_pkey primary key (id),
  constraint captures_camera_has_receipt check (source <> 'camera' or receipt_path is not null),
  constraint captures_receipt_in_own_folder
    check (receipt_path is null or receipt_path like profile_id::text || '/%')
);

create index captures_profile_created_idx on public.captures (profile_id, created_at desc);

-- Only the edge function (service role) writes captures.
alter table public.captures enable row level security;
revoke all on public.captures from anon, authenticated;
grant select on public.captures to authenticated;

create policy "Captures are readable by their owner" on public.captures
for select to authenticated using ((select auth.uid()) = profile_id);

-- Entries remember which capture they came from.
alter table public.entries
  add column capture_id uuid null references public.captures (id) on delete set null;
create index entries_capture_id_idx on public.entries (capture_id) where capture_id is not null;
grant insert (capture_id) on public.entries to authenticated;

insert into public.app_config (key, value, description) values
  ('ai_provider', '"openai"', 'Provider adapter parse-capture uses (openai)'),
  ('ai_model', '"gpt-6-luna"', 'Model id passed to the AI provider'),
  ('stt_model', '"gpt-live-transcribe"', 'OpenAI Realtime model for live voice transcription'),
  ('voice_max_seconds', '60', 'A voice capture stops itself after this many seconds')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------------
-- Receipt photos: private, 5 MB, only in the owner's own folder
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'receipts', 'receipts', false, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "Receipts are uploaded to the owner's folder" on storage.objects
for insert to authenticated
with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Receipts are readable by their owner" on storage.objects
for select to authenticated
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Receipts are deletable by their owner" on storage.objects
for delete to authenticated
using (bucket_id = 'receipts' and (storage.foldername(name))[1] = (select auth.uid())::text);

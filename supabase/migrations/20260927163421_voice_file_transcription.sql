-- Voice captures are recorded on the device and transcribed in parse-capture
-- (OpenAI audio transcriptions) instead of streamed live over Realtime.
update public.app_config set value = '"gpt-4o-mini-transcribe"'::jsonb,
  description = 'OpenAI model that transcribes voice recordings (parse-capture)'
where key = 'stt_model';

import { HttpError, json, serve } from '../_shared/http.ts';
import { admin, readAiUsage, readConfig, requireUser } from '../_shared/supabase.ts';
import { createTranscriptionSession } from './openai.ts';

// Starts a live voice capture: checks the daily AI limit, logs the capture
// (parse-capture later fills in the transcript) and returns a short-lived
// OpenAI client secret for the app's WebRTC connection.

serve(async (request) => {
  if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
  const user = await requireUser(request);
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new HttpError(503, 'transcription_unavailable');

  const config = await readConfig({
    stt_model: 'gpt-live-transcribe',
    voice_max_seconds: 60,
    ai_captures_free: 20,
    ai_captures_plus: 200,
  });
  const usage = await readAiUsage(user.id);
  const limit = Number(usage.plus ? config.ai_captures_plus : config.ai_captures_free);
  if (usage.usedToday >= limit) throw new HttpError(429, 'ai_limit_reached');

  const model = String(config.stt_model);
  let session;
  try {
    // Realtime wants ISO 639-1, so pt-BR becomes pt.
    session = await createTranscriptionSession(apiKey, model, usage.profile.locale.slice(0, 2));
  } catch (error) {
    console.error(error);
    throw new HttpError(502, 'transcription_unavailable');
  }

  const { data: capture, error } = await admin
    .from('captures')
    .insert({ profile_id: user.id, source: 'voice', provider: 'openai', model })
    .select('id')
    .single();
  if (error) throw error;

  return json({
    capture_id: capture.id,
    client_secret: session.clientSecret,
    expires_at: session.expiresAt,
    max_seconds: Number(config.voice_max_seconds),
  });
});

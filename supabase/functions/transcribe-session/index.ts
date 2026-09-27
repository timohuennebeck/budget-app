import { HttpError, json, serve } from '../_shared/http.ts';
import { admin, claimCapture, readConfig, readProfile, requireUser } from '../_shared/supabase.ts';
import { createTranscriptionSession } from './openai.ts';

// Starts a live voice capture: counts it against the daily AI limit, logs it
// as a pending capture (parse-capture later claims it with the transcript)
// and returns a short-lived OpenAI client secret for the app's WebRTC call.

serve(async (request) => {
  if (request.method !== 'POST') throw new HttpError(405, 'method_not_allowed');
  const user = await requireUser(request);
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  if (!apiKey) throw new HttpError(503, 'transcription_unavailable');

  const [config, profile] = await Promise.all([
    readConfig({ stt_model: 'gpt-live-transcribe', voice_max_seconds: 60 }),
    readProfile(user.id),
  ]);
  const model = String(config.stt_model);
  const captureId = await claimCapture({
    profileId: user.id,
    source: 'voice',
    status: 'pending',
    provider: 'openai',
    model,
  });

  try {
    // Realtime wants ISO 639-1, so pt-BR becomes pt.
    const session = await createTranscriptionSession(apiKey, model, profile.locale.slice(0, 2));
    return json({
      capture_id: captureId,
      client_secret: session.clientSecret,
      expires_at: session.expiresAt,
      max_seconds: Number(config.voice_max_seconds),
    });
  } catch (error) {
    console.error(error);
    await admin
      .from('captures')
      .update({ status: 'failed', error_code: 'transcription_unavailable' })
      .eq('id', captureId);
    throw new HttpError(502, 'transcription_unavailable');
  }
});

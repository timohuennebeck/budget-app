import { useEffect, useRef, useState } from 'react';

import { ensureUser } from '@/features/auth/lib/anonymous-user';

import { CaptureError, exchangeRealtimeSdp, startVoiceSession } from '../data/capture-api';
import {
  applyTranscriptEvent,
  emptyTranscript,
  isSettled,
  type RealtimeEvent,
  transcriptText,
} from '../lib/transcript';
import { mediaDevices, RTCPeerConnection } from '../lib/webrtc';

export type VoiceError = 'account' | 'permission' | 'limit' | 'unavailable';
type VoiceStatus = 'connecting' | 'listening' | 'stopping' | 'error';

/** Upper bound for stop() to wait for the last words after the commit. */
const FINAL_WAIT_MS = 4000;

interface Connection {
  peer: RTCPeerConnection;
  stream: MediaStream;
  channel: RTCDataChannel;
}

/**
 * Live dictation through OpenAI Realtime: the edge function hands out a
 * short-lived secret, the microphone streams to OpenAI over WebRTC and the
 * transcript arrives on the data channel. During onboarding it signs in
 * anonymously first; if that's not possible it reports the 'account' error.
 */
export function useLiveTranscription() {
  const [status, setStatus] = useState<VoiceStatus>('connecting');
  const [error, setError] = useState<VoiceError | null>(null);
  const [transcript, setTranscript] = useState(emptyTranscript);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const connection = useRef<Connection | null>(null);
  const latest = useRef(emptyTranscript);
  const captureId = useRef<string | null>(null);
  // Called with every data-channel event while stop() waits.
  const onEvent = useRef<((event: RealtimeEvent) => void) | null>(null);

  const disconnect = () => {
    const current = connection.current;
    connection.current = null;
    current?.stream.getTracks().forEach((track) => track.stop());
    current?.channel.close();
    current?.peer.close();
  };

  useEffect(() => {
    let cancelled = false;
    const fail = (code: VoiceError) => {
      if (cancelled) return;
      disconnect();
      setError(code);
      setStatus('error');
    };

    (async () => {
      if (!(await ensureUser())) return fail('account');
      // The microphone first: a denied permission shouldn't use up an AI capture.
      let stream: MediaStream;
      try {
        stream = await mediaDevices.getUserMedia({ audio: true });
      } catch {
        return fail('permission');
      }
      const peer = new RTCPeerConnection();
      stream.getTracks().forEach((track) => peer.addTrack(track, stream));
      const channel = peer.createDataChannel('oai-events');
      connection.current = { peer, stream, channel };
      if (cancelled) return disconnect();

      channel.addEventListener('message', (message: MessageEvent) => {
        const event = JSON.parse(String(message.data)) as RealtimeEvent;
        latest.current = applyTranscriptEvent(latest.current, event);
        setTranscript(latest.current);
        onEvent.current?.(event);
      });

      let session;
      try {
        session = await startVoiceSession();
      } catch (reason) {
        return fail(
          reason instanceof CaptureError && reason.status === 429 ? 'limit' : 'unavailable',
        );
      }
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        const answer = await exchangeRealtimeSdp(offer.sdp ?? '', session.client_secret);
        await peer.setRemoteDescription({ type: 'answer', sdp: answer });
      } catch {
        return fail('unavailable');
      }
      if (cancelled) return;
      captureId.current = session.capture_id;
      setSecondsLeft(session.max_seconds);
      setStatus('listening');
    })();

    return () => {
      cancelled = true;
      disconnect();
    };
  }, []);

  // Counts down to the session cap (app_config.voice_max_seconds).
  useEffect(() => {
    if (status !== 'listening') return;
    const timer = setInterval(
      () => setSecondsLeft((value) => (value === null ? value : Math.max(0, value - 1))),
      1000,
    );
    return () => clearInterval(timer);
  }, [status]);

  /** Ends the recording and resolves with the final text and capture id. */
  const stop = async () => {
    const channel = connection.current?.channel;
    if (channel?.readyState === 'open') {
      setStatus('stopping');
      // Commit what's still buffered, then wait until every turn (also one
      // server VAD committed earlier) has its final text.
      await new Promise<void>((resolve) => {
        let committed = false;
        const timer = setTimeout(resolve, FINAL_WAIT_MS);
        const finish = () => {
          clearTimeout(timer);
          resolve();
        };
        onEvent.current = (event) => {
          if (event.type === 'input_audio_buffer.committed') committed = true;
          // An empty buffer can't be committed; then nothing new is coming.
          if (event.type === 'error') committed = true;
          if (committed && isSettled(latest.current)) finish();
        };
        channel.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      });
      onEvent.current = null;
    }
    disconnect();
    return { text: transcriptText(latest.current), captureId: captureId.current };
  };

  return { status, error, transcript: transcriptText(transcript), secondsLeft, stop };
}

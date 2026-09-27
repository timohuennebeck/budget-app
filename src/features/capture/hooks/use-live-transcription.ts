import { useEffect, useRef, useState } from 'react';

import { CaptureError, exchangeRealtimeSdp, startVoiceSession } from '../data/capture-api';
import {
  applyTranscriptEvent,
  emptyTranscript,
  isCompletedEvent,
  transcriptText,
} from '../lib/transcript';
import { mediaDevices, RTCPeerConnection } from '../lib/webrtc';

export type VoiceError = 'account' | 'permission' | 'limit' | 'unavailable';
export type VoiceStatus = 'connecting' | 'listening' | 'stopping' | 'error';

/** How long stop() waits for the last words after committing the audio. */
const FINAL_WAIT_MS = 2500;

interface Connection {
  peer: RTCPeerConnection;
  stream: MediaStream;
  channel: RTCDataChannel;
}

function close(connection: Connection | null) {
  connection?.stream.getTracks().forEach((track) => track.stop());
  connection?.channel.close();
  connection?.peer.close();
}

/**
 * Live dictation through OpenAI Realtime: the edge function hands out a
 * short-lived secret, the microphone streams to OpenAI over WebRTC and the
 * transcript arrives on the data channel. Without an account (`enabled`
 * false) it reports the 'account' error right away.
 */
export function useLiveTranscription(enabled: boolean) {
  const [status, setStatus] = useState<VoiceStatus>(enabled ? 'connecting' : 'error');
  const [error, setError] = useState<VoiceError | null>(enabled ? null : 'account');
  const [transcript, setTranscript] = useState(emptyTranscript);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const connection = useRef<Connection | null>(null);
  const latest = useRef(emptyTranscript);
  const captureId = useRef<string | null>(null);
  const onFinal = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const fail = (code: VoiceError) => {
      if (cancelled) return;
      close(connection.current);
      connection.current = null;
      setError(code);
      setStatus('error');
    };

    (async () => {
      let session;
      try {
        session = await startVoiceSession();
      } catch (reason) {
        return fail(
          reason instanceof CaptureError && reason.status === 429 ? 'limit' : 'unavailable',
        );
      }
      if (cancelled) return;
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
      if (cancelled) return close(connection.current);

      channel.addEventListener('message', (message: MessageEvent) => {
        const event = JSON.parse(String(message.data));
        latest.current = applyTranscriptEvent(latest.current, event);
        setTranscript(latest.current);
        if (isCompletedEvent(event) || event.type === 'error') onFinal.current?.();
      });

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
      close(connection.current);
      connection.current = null;
    };
  }, [enabled]);

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
    const current = connection.current;
    if (current?.channel.readyState === 'open') {
      setStatus('stopping');
      // Without turn detection the last words only arrive after a commit.
      await new Promise<void>((resolve) => {
        onFinal.current = resolve;
        setTimeout(resolve, FINAL_WAIT_MS);
        current.channel.send(JSON.stringify({ type: 'input_audio_buffer.commit' }));
      });
    }
    close(current);
    connection.current = null;
    return { text: transcriptText(latest.current), captureId: captureId.current };
  };

  return { status, error, transcript: transcriptText(transcript), secondsLeft, stop };
}

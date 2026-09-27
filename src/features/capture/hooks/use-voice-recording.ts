import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import type { VoiceRecording } from '../data/capture-store';

export type VoiceError = 'account' | 'permission' | 'limit' | 'unavailable';
type VoiceStatus = 'starting' | 'recording' | 'error';

// Speech needs little: 16 kHz mono AAC at 32 kbit/s keeps a minute ~240 KB.
const OPTIONS = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 16_000,
  numberOfChannels: 1,
  bitRate: 32_000,
  isMeteringEnabled: true,
};

// Metering is in dBFS: about -50 is quiet room, 0 is the loudest.
const QUIET_DB = -50;

/**
 * Records on the device from the moment the voice screen opens — no
 * connection to wait for. stop() returns the file; parse-capture transcribes
 * and parses it in one call.
 */
export function useVoiceRecording() {
  const recorder = useAudioRecorder(OPTIONS);
  const state = useAudioRecorderState(recorder, 100);
  const [status, setStatus] = useState<VoiceStatus>('starting');
  const [error, setError] = useState<VoiceError | null>(null);

  useEffect(() => {
    let cancelled = false;
    const fail = (code: VoiceError) => {
      if (cancelled) return;
      setError(code);
      setStatus('error');
    };

    (async () => {
      const permission = await requestRecordingPermissionsAsync().catch(() => null);
      if (!permission?.granted) return fail('permission');
      try {
        await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
        await recorder.prepareToRecordAsync();
        if (cancelled) return;
        recorder.record();
        setStatus('recording');
      } catch {
        fail('unavailable');
      }
    })();

    // Closing the screen mid-sentence discards the recording.
    return () => {
      cancelled = true;
      if (recorder.isRecording) recorder.stop().catch(() => {});
      setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    };
  }, [recorder]);

  /** Ends the recording and returns the file, or null if nothing was recorded. */
  const stop = async (): Promise<VoiceRecording | null> => {
    if (!recorder.isRecording) return null;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    if (!recorder.uri) return null;
    return { uri: recorder.uri, type: Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a' };
  };

  const level =
    state.metering === undefined
      ? 0
      : Math.min(1, Math.max(0, (state.metering - QUIET_DB) / -QUIET_DB));

  return {
    status,
    error,
    /** Seconds recorded so far */
    seconds: Math.floor(state.durationMillis / 1000),
    /** Loudness 0…1 for the listening animation */
    level,
    stop,
  };
}

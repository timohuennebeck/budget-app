import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { APP_AUDIO_MODE } from '@/shared/lib/sounds';

import type { VoiceRecording } from '../data/capture-store';

export type VoiceError = 'account' | 'permission' | 'limit' | 'unavailable';
type VoiceStatus = 'starting' | 'recording';

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
  // Our own flag: once the screen unmounts, expo-audio has already released
  // (and stopped) the native recorder, and reading its properties throws.
  const active = useRef(false);

  useEffect(() => {
    let cancelled = false;
    const fail = (code: VoiceError) => {
      if (!cancelled) setError(code);
    };

    (async () => {
      const permission = await requestRecordingPermissionsAsync().catch(() => null);
      if (!permission?.granted) return fail('permission');
      try {
        await setAudioModeAsync({ ...APP_AUDIO_MODE, allowsRecording: true });
        await recorder.prepareToRecordAsync();
        if (cancelled) return;
        recorder.record();
        active.current = true;
        setStatus('recording');
      } catch {
        fail('unavailable');
      }
    })();

    // Closing the screen mid-sentence discards the recording; expo-audio
    // releases the recorder itself, so only the audio mode is reset here.
    return () => {
      cancelled = true;
      active.current = false;
      setAudioModeAsync(APP_AUDIO_MODE).catch(() => {});
    };
  }, [recorder]);

  /** Ends the recording and returns the file, or null if there's none to send. */
  const stop = async (): Promise<VoiceRecording | null> => {
    if (!active.current) return null;
    active.current = false;
    const stopped = await recorder.stop().then(
      () => true,
      () => false,
    );
    await setAudioModeAsync(APP_AUDIO_MODE).catch(() => {});
    if (!stopped || !recorder.uri) return null;
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

import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Short UI sounds, loaded once at start and reused. They respect the silent
// switch and mix with music instead of pausing it.

const sources = {
  click: require('@/assets/sounds/click.wav'),
  moneyIn: require('@/assets/sounds/money-in.wav'),
  moneyOut: require('@/assets/sounds/money-out.wav'),
};

export type SoundName = keyof typeof sources;

const players = new Map<SoundName, AudioPlayer>();

function player(name: SoundName) {
  let existing = players.get(name);
  if (!existing) {
    existing = createAudioPlayer(sources[name]);
    players.set(name, existing);
  }
  return existing;
}

/** Sets the audio mode and loads every sound, so the first play isn't lost. */
export function preloadSounds() {
  try {
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(
      () => {},
    );
    (Object.keys(sources) as SoundName[]).forEach(player);
  } catch {
    // Without the native module (an old build) the app just stays silent.
  }
}

export function playSound(name: SoundName) {
  try {
    const sound = player(name);
    sound.seekTo(0).catch(() => {});
    sound.play();
  } catch {
    // A missing sound never blocks the tap it belongs to.
  }
}

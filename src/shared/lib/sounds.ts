import { type AudioPlayer, createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// Short UI sounds. Players load lazily on first use and are reused; the mode
// respects the silent switch and mixes with music instead of pausing it.

const sources = {
  click: require('@/assets/sounds/click.wav'),
  correct: require('@/assets/sounds/correct.wav'),
  incorrect: require('@/assets/sounds/incorrect.wav'),
};

export type SoundName = keyof typeof sources;

const players = new Map<SoundName, AudioPlayer>();
let configured = false;

export function playSound(name: SoundName) {
  try {
    if (!configured) {
      configured = true;
      setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(
        () => {},
      );
    }
    let player = players.get(name);
    if (!player) {
      player = createAudioPlayer(sources[name]);
      players.set(name, player);
    }
    player.seekTo(0).catch(() => {});
    player.play();
  } catch {
    // A missing sound never blocks the tap it belongs to.
  }
}

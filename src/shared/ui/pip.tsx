import { Image, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

const sources = {
  account: require('@/assets/images/pip/pip-account.png'),
  basic: require('@/assets/images/pip/pip-basic.png'),
  boxing: require('@/assets/images/pip/pip-boxing.png'),
  cheer: require('@/assets/images/pip/pip-cheer.png'),
  'cheers-arms': require('@/assets/images/pip/pip-cheers-arms.png'),
  clock: require('@/assets/images/pip/pip-clock.png'),
  dizzy: require('@/assets/images/pip/pip-dizzy.png'),
  'door-wave': require('@/assets/images/pip/pip-door-wave.png'),
  magnifier: require('@/assets/images/pip/pip-magnifier.png'),
  mic: require('@/assets/images/pip/pip-mic.png'),
  money: require('@/assets/images/pip/pip-money.png'),
  reading: require('@/assets/images/pip/pip-reading.png'),
  success: require('@/assets/images/pip/pip-success.png'),
  'thumbs-up-stars': require('@/assets/images/pip/pip-thumbs-up-stars.png'),
  'trophy-cheer': require('@/assets/images/pip/pip-trophy-cheer.png'),
  write: require('@/assets/images/pip/pip-write.png'),
} as const;

export type PipPose = keyof typeof sources;

export interface PipProps {
  pose: PipPose;
  size: number;
  style?: StyleProp<ImageStyle>;
}

/** Pip, the app mascot, in one of the illustrated poses. */
export function Pip({ pose, size, style }: PipProps) {
  return (
    <Image
      source={sources[pose]}
      contentFit="contain"
      accessibilityLabel="Pip"
      style={[{ width: size, height: size }, style]}
    />
  );
}

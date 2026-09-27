import { Image } from 'expo-image';

const flags = {
  br: require('@/assets/images/flags/br.png'),
  ch: require('@/assets/images/flags/ch.png'),
  de: require('@/assets/images/flags/de.png'),
  es: require('@/assets/images/flags/es.png'),
  eu: require('@/assets/images/flags/eu.png'),
  fr: require('@/assets/images/flags/fr.png'),
  gb: require('@/assets/images/flags/gb.png'),
  it: require('@/assets/images/flags/it.png'),
  pt: require('@/assets/images/flags/pt.png'),
  us: require('@/assets/images/flags/us.png'),
} as const;

export type FlagCode = keyof typeof flags;

export function Flag({ code, size }: { code: FlagCode; size: number }) {
  return (
    <Image
      source={flags[code]}
      contentFit="cover"
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1,
        borderColor: 'rgba(22,24,34,0.1)',
      }}
    />
  );
}

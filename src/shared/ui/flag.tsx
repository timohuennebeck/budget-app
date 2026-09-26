import { Image } from 'expo-image';

const flags = {
  br: require('@/assets/images/flags/br.svg'),
  ch: require('@/assets/images/flags/ch.svg'),
  de: require('@/assets/images/flags/de.svg'),
  es: require('@/assets/images/flags/es.svg'),
  eu: require('@/assets/images/flags/eu.svg'),
  fr: require('@/assets/images/flags/fr.svg'),
  gb: require('@/assets/images/flags/gb.svg'),
  it: require('@/assets/images/flags/it.svg'),
  pt: require('@/assets/images/flags/pt.svg'),
  us: require('@/assets/images/flags/us.svg'),
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

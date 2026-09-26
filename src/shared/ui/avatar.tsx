import { View } from 'react-native';

import { Text } from './text';

/** Initial in a soft blue circle, used for the profile and logout screens. */
export function InitialAvatar({ name, size = 62 }: { name: string; size?: number }) {
  return (
    <View
      className="items-center justify-center rounded-full bg-primary-soft"
      style={{ width: size, height: size }}>
      <Text size={Math.round(size * 0.39)} weight="semibold" className="text-primary">
        {(name.trim()[0] ?? '?').toUpperCase()}
      </Text>
    </View>
  );
}

import { View } from 'react-native';

import { huePalette } from '@/shared/lib/color';
import { Icon } from '@/shared/ui/icon';

interface CategoryAvatarProps {
  icon: string;
  hue: number;
  size?: number;
}

export function CategoryAvatar({ icon, hue, size = 42 }: CategoryAvatarProps) {
  const palette = huePalette(hue);
  return (
    <View
      className="items-center justify-center rounded-full"
      style={{ width: size, height: size, backgroundColor: palette.background }}>
      <Icon name={icon} weight="fill" size={Math.round(size * 0.47)} color={palette.foreground} />
    </View>
  );
}

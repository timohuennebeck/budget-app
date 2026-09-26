import { View } from 'react-native';

import { huePalette } from '@/shared/lib/color';
import { Icon } from '@/shared/ui/icon';

interface CategoryAvatarProps {
  icon: string;
  hue: number;
  size?: number;
  /** Adds the white gap + blue ring used for the selected icon choice */
  selected?: boolean;
}

export function CategoryAvatar({ icon, hue, size = 42, selected }: CategoryAvatarProps) {
  const palette = huePalette(hue);
  return (
    <View
      className="items-center justify-center rounded-full"
      style={[
        { width: size, height: size, backgroundColor: palette.background },
        selected && { borderWidth: 2, borderColor: '#2F7CF6' },
      ]}>
      <Icon name={icon} weight="fill" size={Math.round(size * 0.47)} color={palette.foreground} />
    </View>
  );
}

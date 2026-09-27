import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

/** Android: the chosen value; tapping it opens the system picker dialog. */
export function PickerField({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      className="h-[72px] items-center justify-center rounded-[20px] bg-field">
      <Text size={32} weight="semibold" style={{ fontVariant: ['tabular-nums'] }}>
        {label}
      </Text>
    </Pressable>
  );
}

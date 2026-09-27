import { View } from 'react-native';

import { cn } from '@/shared/lib/cn';

/**
 * The 2px blue ring of a selected card, drawn over its 1px border so the
 * content doesn't move when the selection changes. Pass the card's radius.
 */
export function SelectionRing({ visible, className }: { visible: boolean; className: string }) {
  if (!visible) return null;
  return (
    <View
      pointerEvents="none"
      className={cn('absolute -inset-px border-2 border-primary', className)}
    />
  );
}

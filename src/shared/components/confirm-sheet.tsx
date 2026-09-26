import { Button } from '@/shared/ui/button';
import { Pip, type PipPose } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

import { Sheet, type SheetControls } from './sheet';

interface ConfirmSheetProps extends SheetControls {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  pose?: PipPose;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmSheet({
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  pose,
  destructive,
  loading,
  ...controls
}: ConfirmSheetProps) {
  return (
    <Sheet {...controls}>
      {pose ? <Pip pose={pose} size={96} style={{ alignSelf: 'center', marginTop: 14 }} /> : null}
      <Text variant="title" size={24} tracking={-0.03} className="mt-3.5 text-center">
        {title}
      </Text>
      <Text variant="body" size={15} className="mt-2 text-center">
        {message}
      </Text>
      <Button
        className="mt-6"
        label={confirmLabel}
        variant={destructive ? 'danger' : 'primary'}
        haptic={destructive ? 'warning' : 'press'}
        loading={loading}
        onPress={onConfirm}
      />
      <Button className="mt-2.5" variant="ghost" label={cancelLabel} onPress={controls.onClose} />
    </Sheet>
  );
}

import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { haptics } from '@/shared/lib/haptics';
import { colors, shadows } from '@/shared/lib/theme';
import { IconButton } from '@/shared/ui/icon-button';
import { Text } from '@/shared/ui/text';

export interface SheetControls {
  open: boolean;
  onClose: () => void;
}

export interface SheetProps extends SheetControls {
  children: ReactNode;
  /** Centered title with a close button, like the budget sheets */
  title?: string;
  /** Fixed height in px; by default the sheet sizes to its content */
  height?: number;
}

function Backdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} appearsOnIndex={0} disappearsOnIndex={-1} opacity={0.3} />;
}

// Floating sheet from the design: inset 8px from the screen edges, 36px
// corner radius, grabber on top and a dimmed backdrop that closes on tap.
// Content mounts on open, so state inside starts fresh every time.
export function Sheet({ open, onClose, children, title, height }: SheetProps) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const ref = useRef<BottomSheetModal>(null);

  useEffect(() => {
    if (open) ref.current?.present();
    else ref.current?.dismiss();
  }, [open]);

  return (
    <BottomSheetModal
      ref={ref}
      detached
      bottomInset={Math.max(insets.bottom - 26, 8)}
      style={[{ marginHorizontal: 8 }, shadows.sheet]}
      snapPoints={height ? [height] : undefined}
      enableDynamicSizing={!height}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={Backdrop}
      onDismiss={onClose}
      backgroundStyle={{ borderRadius: 36, backgroundColor: colors.white }}
      handleIndicatorStyle={{ width: 36, height: 5, backgroundColor: '#D5DAE3' }}>
      <BottomSheetView
        style={{ paddingHorizontal: 20, paddingBottom: 26, flex: height ? 1 : undefined }}>
        {title ? (
          <View className="mt-1.5 flex-row items-center justify-between">
            <View className="size-[34px]" />
            <Text size={17} weight="semibold" tracking={-0.01}>
              {title}
            </Text>
            <IconButton
              icon="x"
              iconSize={14}
              accessibilityLabel={t('common.close')}
              onPress={onClose}
            />
          </View>
        ) : null}
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}

/** Open state for a Sheet; spread `controls` onto the sheet component. */
export function useSheet() {
  const [open, setOpen] = useState(false);
  const present = useCallback(() => {
    haptics.tap();
    setOpen(true);
  }, []);
  const dismiss = useCallback(() => setOpen(false), []);
  return { present, dismiss, controls: { open, onClose: dismiss } satisfies SheetControls };
}

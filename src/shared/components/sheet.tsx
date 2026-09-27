import {
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetTextInput,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { initialWindowMetrics } from 'react-native-safe-area-context';

import { displayCornerRadius } from '@/shared/lib/display-corners';
import { haptics } from '@/shared/lib/haptics';
import { colors, shadows } from '@/shared/lib/theme';
import { IconButton } from '@/shared/ui/icon-button';
import { type InputComponent, InputComponentContext } from '@/shared/ui/input-component';
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

// Floating sheet from the design: inset 8px from the screen edges, corners
// concentric with the iPhone's display corners, grabber on top and a dimmed
// backdrop that closes on tap. It rises with the keyboard.
// Content mounts on open, so state inside starts fresh every time.
const INSET = 8;
// Concentric with the display corners: their radius minus the inset.
const RADIUS = displayCornerRadius() - INSET;
// The window's home-indicator inset, not useSafeAreaInsets(): inside a tab
// that one includes the tab bar and pushed the sheet up by its height.
const WINDOW_BOTTOM = initialWindowMetrics?.insets.bottom ?? 0;
// Same gap below the sheet as beside it.
const BOTTOM_INSET = Math.max(WINDOW_BOTTOM - 26, INSET);

export function Sheet({ open, onClose, children, title, height }: SheetProps) {
  const { t } = useTranslation();
  const ref = useRef<BottomSheetModal>(null);
  const presented = useRef(false);

  // Only dismiss a sheet that was presented: dismissing an unmounted modal
  // leaves gorhom in a "dismissing" state that blocks every later present().
  useEffect(() => {
    if (open) {
      presented.current = true;
      ref.current?.present();
    } else if (presented.current) {
      presented.current = false;
      ref.current?.dismiss();
    }
  }, [open]);

  const handleDismiss = () => {
    presented.current = false;
    onClose();
  };

  return (
    <BottomSheetModal
      ref={ref}
      detached
      bottomInset={BOTTOM_INSET}
      style={[{ marginHorizontal: INSET }, shadows.sheet]}
      snapPoints={height ? [height] : undefined}
      enableDynamicSizing={!height}
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      backdropComponent={Backdrop}
      onDismiss={handleDismiss}
      android_keyboardInputMode="adjustResize"
      backgroundStyle={{ borderRadius: RADIUS, backgroundColor: colors.white }}
      handleIndicatorStyle={{ width: 36, height: 5, backgroundColor: colors.grabber }}>
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
        <InputComponentContext.Provider value={BottomSheetTextInput as InputComponent}>
          {children}
        </InputComponentContext.Provider>
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

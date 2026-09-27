import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { cn } from '@/shared/lib/cn';

import { GradientBackground, type GradientName } from './gradient-background';

const KEYBOARD_GAP = 24;

export interface ScreenProps {
  children: ReactNode;
  /** Pinned below the content, above the home indicator */
  footer?: ReactNode;
  /** Rendered above everything, e.g. coach marks or popovers with a scrim */
  overlay?: ReactNode;
  gradient?: GradientName;
  /** Limit the gradient to the top part of the screen, in px */
  gradientHeight?: number;
  scroll?: boolean;
  /** Horizontal padding; the app screens use 16, flows use 20 */
  inset?: 16 | 20;
  /** Keep space for the native tab bar */
  tabBar?: boolean;
  className?: string;
}

// Base layout for every screen: canvas background, optional gradient, safe
// area padding from useSafeAreaInsets and a footer slot for primary actions.
// The keyboard covers the footer instead of pushing it up, while the content
// above moves up to keep the focused field KEYBOARD_GAP clear of it. Tapping
// anywhere outside a field closes the keyboard.
export function Screen({
  children,
  footer,
  overlay,
  gradient,
  gradientHeight,
  scroll,
  inset = 20,
  tabBar,
  className,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottom = tabBar ? 16 : Math.max(insets.bottom, 16);
  const padding = { paddingHorizontal: inset };

  // Non-scrolling screens use a fixed ScrollView too: it closes the keyboard
  // on taps outside a field without taking gestures from the content.
  const body = (
    <ScrollView
      className="flex-1"
      scrollEnabled={scroll}
      contentContainerClassName="grow"
      contentContainerStyle={[padding, { paddingBottom: footer ? (scroll ? 16 : 0) : bottom }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode={scroll ? 'interactive' : 'none'}
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  );

  return (
    <View className={cn('flex-1 bg-canvas', className)} style={{ paddingTop: insets.top + 4 }}>
      {gradient ? <GradientBackground name={gradient} height={gradientHeight} /> : null}
      {/* Android pans the window itself (softwareKeyboardLayoutMode). */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={KEYBOARD_GAP}
        className="flex-1">
        {body}
      </KeyboardAvoidingView>
      {footer ? (
        <View style={[padding, { paddingBottom: bottom, paddingTop: 12 }]}>{footer}</View>
      ) : null}
      {overlay ? <View className="absolute inset-0 z-20">{overlay}</View> : null}
    </View>
  );
}

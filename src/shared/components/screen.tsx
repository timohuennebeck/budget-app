import type { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
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

  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName="grow"
      contentContainerStyle={[padding, { paddingBottom: footer ? 16 : bottom }]}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}>
      {children}
    </ScrollView>
  ) : (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View className="flex-1" style={[padding, footer ? null : { paddingBottom: bottom }]}>
        {children}
      </View>
    </TouchableWithoutFeedback>
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

import { forwardRef, type ReactNode } from 'react';
import { type TextInput, type TextInputProps, View } from 'react-native';

import { useInputComponent } from './input-component';
import { Text } from './text';

export interface FittedInputProps extends Omit<TextInputProps, 'value'> {
  value: string;
  size: number;
  /** Letter spacing in em, like Text */
  tracking?: number;
  /** Custom look for the visible value, e.g. smaller decimals */
  renderValue?: (value: string) => ReactNode;
}

// Bold number input that is exactly as wide as its value. A Text sizes the
// box and a transparent input on top handles typing, because inputs have no
// intrinsic width on web and would push neighbouring symbols off-screen.
// Digits are tabular so the layout doesn't jump while stepping.
export const FittedInput = forwardRef<TextInput, FittedInputProps>(function FittedInput(
  { value, size, tracking = -0.05, renderValue, className, style, ...props },
  ref,
) {
  const Input = useInputComponent();
  return (
    <View className={className}>
      <Text
        size={size}
        weight="bold"
        tracking={tracking}
        leading={1.15}
        style={{ fontVariant: ['tabular-nums'] }}>
        {renderValue ? renderValue(value) : value || ' '}
      </Text>
      <Input
        ref={ref}
        value={value}
        className="absolute inset-0 font-inter-bold"
        style={[
          {
            fontSize: size,
            letterSpacing: tracking * size,
            padding: 0,
            color: 'transparent',
            fontVariant: ['tabular-nums'],
          },
          style,
        ]}
        {...props}
      />
    </View>
  );
});

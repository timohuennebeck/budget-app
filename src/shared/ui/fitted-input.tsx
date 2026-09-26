import { forwardRef, type ReactNode } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

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
export const FittedInput = forwardRef<TextInput, FittedInputProps>(function FittedInput(
  { value, size, tracking = -0.05, renderValue, className, style, ...props },
  ref,
) {
  return (
    <View className={className}>
      <Text size={size} weight="bold" tracking={tracking} leading={1.15}>
        {renderValue ? renderValue(value) : value || ' '}
      </Text>
      <TextInput
        ref={ref}
        value={value}
        className="absolute inset-0 font-inter-bold"
        style={[
          { fontSize: size, letterSpacing: tracking * size, padding: 0, color: 'transparent' },
          style,
        ]}
        {...props}
      />
    </View>
  );
});

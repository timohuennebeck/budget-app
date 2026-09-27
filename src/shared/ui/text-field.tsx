import { forwardRef, useState } from 'react';
import { type TextInput, type TextInputProps, View } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/lib/theme';

import { Icon, type IconName } from './icon';
import { useInputComponent } from './input-component';
import { Pressable } from './pressable';
import { SelectionRing } from './selection-ring';
import { Text } from './text';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  leadingIcon?: IconName;
  /** Adds an eye toggle for password fields */
  revealable?: boolean;
  /** Shows a clear button while there is text */
  clearable?: boolean;
  /** `pill`: fully rounded ends, used by the search fields */
  shape?: 'rounded' | 'pill';
  containerClassName?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    leadingIcon,
    revealable,
    clearable,
    shape = 'rounded',
    containerClassName,
    secureTextEntry,
    onFocus,
    onBlur,
    value,
    onChangeText,
    className,
    ...props
  },
  ref,
) {
  const Input = useInputComponent();
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <View className={containerClassName}>
      {label ? (
        <Text variant="overline" className="mb-2">
          {label}
        </Text>
      ) : null}
      <View
        className={cn(
          'h-14 flex-row items-center gap-2.5 border border-line-strong bg-surface px-4',
          shape === 'pill' ? 'rounded-full px-5' : 'rounded-[18px]',
        )}>
        <SelectionRing
          visible={focused}
          className={shape === 'pill' ? 'rounded-full' : 'rounded-[18px]'}
        />
        {leadingIcon ? <Icon name={leadingIcon} size={17} color={colors.subtle} /> : null}
        <Input
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.faint}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          secureTextEntry={secureTextEntry && !revealed}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          className={cn('h-full flex-1 font-inter text-ink', className)}
          // Size without a line height: iOS clips input text and placeholders
          // that get one.
          style={{ fontSize: 17, paddingVertical: 0 }}
          {...props}
        />
        {clearable && value ? (
          <Pressable
            onPress={() => onChangeText?.('')}
            accessibilityLabel="Clear"
            className="size-[22px] items-center justify-center rounded-full bg-field">
            <Icon name="x" size={11} color={colors.mutedSoft} />
          </Pressable>
        ) : null}
        {revealable ? (
          <Pressable
            haptic="select"
            onPress={() => setRevealed((current) => !current)}
            accessibilityLabel="Toggle password visibility">
            <Icon
              name={revealed ? 'eye-slash' : 'eye'}
              weight="regular"
              size={20}
              color={colors.subtle}
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
});

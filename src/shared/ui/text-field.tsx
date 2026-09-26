import { forwardRef, useState } from 'react';
import { TextInput, View, type TextInputProps } from 'react-native';

import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/lib/theme';

import { Icon, type IconName } from './icon';
import { Pressable } from './pressable';
import { Text } from './text';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  leadingIcon?: IconName;
  /** Adds an eye toggle for password fields */
  revealable?: boolean;
  /** Shows a clear button while there is text */
  clearable?: boolean;
  size?: 'md' | 'lg';
  /** `filled` is the borderless grey search field */
  variant?: 'outline' | 'filled';
  containerClassName?: string;
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  {
    label,
    leadingIcon,
    revealable,
    clearable,
    size = 'lg',
    variant = 'outline',
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
          'flex-row items-center gap-2.5 px-4',
          size === 'lg' ? 'h-14 rounded-[18px]' : 'h-[46px] rounded-[18px]',
          variant === 'filled'
            ? 'h-[50px] rounded-2xl bg-field'
            : cn('bg-surface', focused ? 'border-2 border-primary' : 'border border-line-strong'),
        )}>
        {leadingIcon ? <Icon name={leadingIcon} size={17} color={colors.subtle} /> : null}
        <TextInput
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
          className={cn(
            'flex-1 font-inter text-ink',
            size === 'lg' ? 'text-[17px]' : 'text-[16px]',
            className,
          )}
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

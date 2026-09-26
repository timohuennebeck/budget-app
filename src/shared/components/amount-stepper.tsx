import { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { cn } from '@/shared/lib/cn';
import { haptics } from '@/shared/lib/haptics';
import { currencySymbol } from '@/shared/lib/money';
import { Chip } from '@/shared/ui/chip';
import { FittedInput } from '@/shared/ui/fitted-input';
import { IconButton } from '@/shared/ui/icon-button';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

export interface AmountStepperProps {
  value: number;
  onChange: (value: number) => void;
  currency: string;
  step?: number;
  /** `lg` is used inside sheets, `md` inside cards */
  size?: 'md' | 'lg';
  hint?: string;
}

const MIN = 0;
const MAX = 1_000_000;

const sizes = {
  md: { number: 64, symbol: 36, caret: 52 },
  lg: { number: 72, symbol: 40, caret: 58 },
};

// Big "− 800 € +" control. The number itself is a text input so users can
// type an exact amount instead of stepping.
export function AmountStepper({
  value,
  onChange,
  currency,
  step = 10,
  size = 'md',
  hint,
}: AmountStepperProps) {
  const { t } = useTranslation();
  const input = useRef<TextInput>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const metrics = sizes[size];

  const clamp = (next: number) => Math.min(MAX, Math.max(MIN, next));
  const stepBy = (direction: 1 | -1) => {
    const next = clamp(Math.round(value / step) * step + direction * step);
    if (next !== value) haptics.select();
    onChange(next);
  };

  return (
    <View className="items-center gap-2.5 self-stretch">
      <View className="flex-row items-center justify-between self-stretch">
        <IconButton
          icon="minus"
          size={56}
          iconSize={18}
          haptic="none"
          accessibilityLabel={t('common.decrease')}
          disabled={value <= MIN}
          onPress={() => stepBy(-1)}
        />
        <Pressable
          haptic="none"
          onPress={() => input.current?.focus()}
          className="flex-row items-center">
          <FittedInput
            ref={input}
            size={metrics.number}
            value={draft ?? String(value)}
            onChangeText={(text) => setDraft(text.replace(/\D/g, '').slice(0, 7))}
            onFocus={() => setDraft(String(value))}
            onBlur={() => {
              if (draft !== null && draft !== '') onChange(clamp(Number(draft)));
              setDraft(null);
            }}
            keyboardType="number-pad"
            returnKeyType="done"
            caretHidden
            selectTextOnFocus
          />
          <View className="mx-1 w-[3px] rounded-sm bg-primary" style={{ height: metrics.caret }} />
          <Text size={metrics.symbol} weight="bold" tracking={-0.05}>
            {currencySymbol(currency)}
          </Text>
        </Pressable>
        <IconButton
          icon="plus"
          size={56}
          iconSize={18}
          haptic="none"
          accessibilityLabel={t('common.increase')}
          disabled={value >= MAX}
          onPress={() => stepBy(1)}
        />
      </View>
      {hint ? (
        <Text
          size={size === 'lg' ? 15 : 14}
          className={size === 'lg' ? 'text-muted-soft' : 'text-subtle'}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

export interface QuickOption<T> {
  label: string;
  value: T;
}

interface QuickAmountsProps<T> {
  options: QuickOption<T>[];
  selected: T;
  onSelect: (value: T) => void;
  /** `outline` pills (cards) or `soft` equal-width pills (sheets) */
  variant?: 'outline' | 'soft';
  className?: string;
}

export function QuickAmounts<T>({
  options,
  selected,
  onSelect,
  variant = 'outline',
  className,
}: QuickAmountsProps<T>) {
  return (
    <View className={cn('flex-row justify-center gap-2', className)}>
      {options.map((option) => (
        <Chip
          key={String(option.value)}
          label={option.label}
          size="md"
          fill={variant === 'soft'}
          variant={option.value === selected ? 'selected' : variant === 'soft' ? 'soft' : 'outline'}
          onPress={() => onSelect(option.value)}
        />
      ))}
    </View>
  );
}

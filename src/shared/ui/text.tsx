import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/shared/lib/cn';

type Weight = 'regular' | 'medium' | 'semibold' | 'bold';

export type TextVariant =
  | 'hero'
  | 'display'
  | 'title'
  | 'heading'
  | 'section'
  | 'row'
  | 'button'
  | 'body'
  | 'label'
  | 'caption'
  | 'overline';

interface VariantStyle {
  size: number;
  weight: Weight;
  /** Letter spacing in em, converted to px because React Native needs px */
  tracking?: number;
  /** Line height as a multiple of the font size */
  leading?: number;
  className?: string;
}

const variants: Record<TextVariant, VariantStyle> = {
  hero: { size: 60, weight: 'bold', tracking: -0.05, leading: 1 },
  display: { size: 32, weight: 'semibold', tracking: -0.032, leading: 1.1 },
  title: { size: 29, weight: 'semibold', tracking: -0.035, leading: 1.12 },
  heading: { size: 21, weight: 'semibold', tracking: -0.02, leading: 1.25 },
  section: { size: 18, weight: 'semibold', tracking: -0.02 },
  row: { size: 16, weight: 'semibold', tracking: -0.01 },
  button: { size: 17.5, weight: 'semibold' },
  body: { size: 15.5, weight: 'regular', leading: 1.45, className: 'text-muted-soft' },
  label: { size: 15, weight: 'medium' },
  caption: { size: 13.5, weight: 'regular', className: 'text-subtle' },
  overline: { size: 12, weight: 'semibold', tracking: 0.08, className: 'uppercase text-subtle' },
};

const weightClass: Record<Weight, string> = {
  regular: 'font-inter',
  medium: 'font-inter-medium',
  semibold: 'font-inter-semibold',
  bold: 'font-inter-bold',
};

export interface TextProps extends RNTextProps {
  variant?: TextVariant;
  size?: number;
  weight?: Weight;
  tracking?: number;
  leading?: number;
}

export function Text({
  variant = 'label',
  size,
  weight,
  tracking,
  leading,
  className,
  style,
  ...props
}: TextProps) {
  const preset = variants[variant];
  const fontSize = size ?? preset.size;
  const letterEm = tracking ?? preset.tracking;
  const lineMultiple = leading ?? preset.leading;

  return (
    <RNText
      className={cn('text-ink', weightClass[weight ?? preset.weight], preset.className, className)}
      style={[
        {
          fontSize,
          letterSpacing: letterEm ? letterEm * fontSize : undefined,
          lineHeight: lineMultiple ? Math.round(lineMultiple * fontSize) : undefined,
        },
        style,
      ]}
      {...props}
    />
  );
}

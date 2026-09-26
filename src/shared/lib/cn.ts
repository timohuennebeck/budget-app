import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach tailwind-merge about our theme tokens so e.g. `text-muted` and
// `text-[15px]` are treated as colour vs. size and don't cancel each other.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-family': [{ font: ['inter', 'inter-medium', 'inter-semibold', 'inter-bold'] }],
    },
    theme: {
      color: [
        'primary',
        'primary-dark',
        'primary-soft',
        'primary-tint',
        'primary-wash',
        'primary-mark',
        'ink',
        'ink-soft',
        'muted',
        'muted-soft',
        'subtle',
        'faint',
        'chevron',
        'hint',
        'canvas',
        'surface',
        'field',
        'line',
        'line-strong',
        'line-card',
        'grabber',
        'dot',
        'danger',
        'danger-text',
        'danger-soft',
        'success-soft',
        'success',
        'camera',
        'scrim',
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

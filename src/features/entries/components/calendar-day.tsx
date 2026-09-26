import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/lib/theme';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

export type DayTone = 'expense' | 'income' | 'empty' | 'future' | 'outside';

interface CalendarDayProps {
  day: number;
  tone: DayTone;
  /** Short net amount, e.g. "−92" or "+120" */
  label?: string;
  selected: boolean;
  onPress?: () => void;
}

const containers: Record<DayTone, string> = {
  expense: 'bg-danger-soft border-2 border-[#DB4241]',
  income: 'bg-primary-tint border-2 border-primary',
  empty: 'border-2 border-line-strong',
  future: 'border-2 border-line-strong',
  outside: 'border-2 border-line-strong',
};

/** One day tile: red for net spending, blue for net income. */
export function CalendarDay({ day, tone, label, selected, onPress }: CalendarDayProps) {
  const solid = selected && (tone === 'expense' || tone === 'income');
  const accent = tone === 'income' ? colors.primary : colors.calendarRed;

  return (
    <Pressable
      haptic="select"
      disabled={!onPress}
      onPress={onPress}
      accessibilityLabel={`${day} ${label ?? ''}`}
      className={cn(
        'h-[62px] flex-1 items-center justify-center gap-px rounded-3xl',
        containers[tone],
        tone === 'outside' && 'opacity-50',
      )}
      style={
        solid
          ? {
              backgroundColor: accent,
              borderColor: accent,
              boxShadow: '0 6px 14px rgba(21,24,31,0.18)',
            }
          : undefined
      }>
      <Text
        size={16}
        weight="semibold"
        tracking={-0.01}
        className={cn(
          solid
            ? 'text-white'
            : tone === 'future' || tone === 'outside'
              ? 'text-faint'
              : 'text-ink',
        )}>
        {day}
      </Text>
      {tone === 'expense' || tone === 'income' || tone === 'empty' ? (
        <Text
          size={10.5}
          weight="semibold"
          style={{ color: solid ? colors.white : tone === 'empty' ? colors.faint : accent }}>
          {label ?? '–'}
        </Text>
      ) : null}
    </Pressable>
  );
}

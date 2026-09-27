import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GradientPanel } from '@/shared/components/gradient-panel';
import { useNow } from '@/shared/hooks/use-now';
import { addDays, formatWeekRange, isSameDay } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { colors, shadows } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

import { useCheckInState } from '../hooks/use-check-in-state';
import { accuracyPercent } from '../lib/check-in-window';
import { formatCountdown } from '../lib/countdown';

/** A small card on two tilted ones: "???" until done, then the result. */
function Paper({ value, range }: { value: string; range: string }) {
  return (
    <View className="h-[108px] w-full items-center justify-center">
      <View
        className="absolute h-[88px] w-[132px] rounded-[16px] bg-white/55"
        style={{ transform: [{ translateX: -40 }, { rotate: '-7deg' }] }}
      />
      <View
        className="absolute h-[88px] w-[132px] rounded-[16px] bg-white/55"
        style={{ transform: [{ translateX: 40 }, { rotate: '7deg' }] }}
      />
      <View
        className="h-[96px] w-[144px] items-center justify-center gap-1 rounded-[18px] bg-surface"
        style={shadows.floating}>
        <Text size={26} weight="bold" tracking={-0.03}>
          {value}
        </Text>
        <Text size={12.5} className="text-subtle">
          {range}
        </Text>
      </View>
    </View>
  );
}

// This week's check-in as the big card on the Check-ins tab (5t-m). Same card
// in every state; only the texts change, and the button works while open.
export function CheckInHero({ currency }: { currency: string }) {
  const { t } = useTranslation();
  // Ticks every second so the countdown runs and the card opens on time.
  const now = useNow();
  const { status, window, current, daysLeft } = useCheckInState(now);
  const until = (date: Date) => formatCountdown(date.getTime() - now.getTime());
  // After this week's check-in the next one opens a week later.
  const nextOpen = window.isOpen ? addDays(window.opensAt, 7) : window.opensAt;
  const percent = current ? accuracyPercent(current) : null;
  const money = (value: number) => formatMoney(value, { currency, compact: true });

  const content =
    status === 'open'
      ? {
          value: '???',
          eyebrow: t('checkIn.heroOpen', { count: daysLeft }),
          title: t('checkIn.heroOpenTitle'),
          button: t('checkIn.start'),
        }
      : status === 'done' && current
        ? {
            value: percent === null ? '–' : `${percent} %`,
            eyebrow: t('checkIn.doneTitle'),
            title:
              current.guess === null
                ? t('checkIn.skipped')
                : t('checkIn.rowDetail', {
                    guess: money(Number(current.guess)),
                    actual: money(Number(current.actual ?? 0)),
                  }),
            button: t('checkIn.opensIn', { time: until(nextOpen) }),
          }
        : status === 'missed'
          ? {
              value: '???',
              eyebrow: t('checkIn.missedTitle'),
              title: t('checkIn.heroMissedTitle'),
              button: t('checkIn.opensIn', { time: until(nextOpen) }),
            }
          : {
              value: '???',
              eyebrow: t('checkIn.notOpenYet'),
              // On a Sunday whose check-in isn't today's (a new user's first
              // week), plain "Sunday" would read as today.
              title:
                now.getDay() === 0 && !isSameDay(window.opensAt, now)
                  ? t('checkIn.heroLockedTitleNextWeek')
                  : t('checkIn.heroLockedTitle'),
              button: t('checkIn.opensIn', { time: until(window.opensAt) }),
            };

  return (
    <View className="mt-[18px] overflow-hidden rounded-[28px]">
      <GradientPanel style={{ marginTop: 0, borderRadius: 0, padding: 20 }}>
        <Paper value={content.value} range={formatWeekRange(window.week)} />
        <Text
          size={12.5}
          weight="semibold"
          tracking={0.08}
          className="mt-4 text-center text-muted-soft">
          {content.eyebrow.toUpperCase()}
        </Text>
        <Text size={20} weight="semibold" tracking={-0.02} className="mt-1.5 text-center">
          {content.title}
        </Text>
        <Button
          className="mt-[18px]"
          label={content.button}
          // The countdown ticks every second; fixed-width digits keep it still.
          tabularNums
          disabled={status !== 'open'}
          onPress={() => router.push('/check-in')}
        />
      </GradientPanel>
      {/* The border is an overlay: iOS paints a view's own border beneath its
          children, where the gradient hides it. The line colour would vanish
          on the blue panel, so it uses the soft primary. */}
      <View
        pointerEvents="none"
        className="absolute inset-0 rounded-[28px] border"
        style={{ borderColor: colors.primarySoft }}
      />
    </View>
  );
}

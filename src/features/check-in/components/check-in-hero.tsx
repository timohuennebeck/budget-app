import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GradientPanel } from '@/shared/components/gradient-panel';
import { addDays, formatShortDate, formatTime, formatWeekRange } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { colors, shadows } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

import { useCheckInState } from '../hooks/use-check-in-state';
import { accuracyPercent } from '../lib/check-in-window';

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
  const { status, window, current, daysLeft } = useCheckInState();
  const at = (date: Date) => `${formatShortDate(date)}, ${formatTime(date)}`;
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
            button: t('checkIn.nextOn', { date: at(nextOpen) }),
          }
        : status === 'missed'
          ? {
              value: '???',
              eyebrow: t('checkIn.missedTitle'),
              title: t('checkIn.heroMissedTitle'),
              button: t('checkIn.nextOn', { date: at(nextOpen) }),
            }
          : {
              value: '???',
              eyebrow: t('checkIn.notOpenYet'),
              title: t('checkIn.heroLockedTitle'),
              button: t('checkIn.from', { date: at(window.opensAt) }),
            };

  return (
    <GradientPanel style={{ marginTop: 18, padding: 20, borderWidth: 1, borderColor: colors.line }}>
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
        disabled={status !== 'open'}
        onPress={() => router.push('/check-in')}
      />
    </GradientPanel>
  );
}

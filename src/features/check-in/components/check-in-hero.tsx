import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GradientPanel } from '@/shared/components/gradient-panel';
import { formatMoney } from '@/shared/lib/money';
import { formatShortDate, formatTime, formatWeekRange } from '@/shared/lib/dates';
import { colors, shadows } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

import { useCheckInState } from '../hooks/use-check-in-state';
import { accuracyPercent } from '../lib/check-in-window';

/** A small card on two tilted ones: "???" while open, the result once done. */
function Paper({ children, range }: { children: ReactNode; range: string }) {
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
        {children}
        <Text size={12.5} className="text-subtle">
          {range}
        </Text>
      </View>
    </View>
  );
}

// This week's check-in as the big card on the Check-ins tab (5t-m): open with
// "Starten", or its result, or when the next one opens.
export function CheckInHero({ currency }: { currency: string }) {
  const { t } = useTranslation();
  const { status, window, current, daysLeft } = useCheckInState();
  const range = formatWeekRange(window.week);
  const percent = current ? accuracyPercent(current) : null;

  const content =
    status === 'open'
      ? {
          big: '???',
          eyebrow: t('checkIn.heroOpen', { count: daysLeft }),
          title: t('checkIn.heroOpenTitle'),
        }
      : status === 'done' && current
        ? {
            big: percent === null ? '–' : `${percent} %`,
            eyebrow: t('checkIn.doneTitle'),
            title:
              current.guess === null
                ? t('checkIn.skipped')
                : t('checkIn.rowDetail', {
                    guess: formatMoney(Number(current.guess), { currency, compact: true }),
                    actual: formatMoney(Number(current.actual ?? 0), { currency, compact: true }),
                  }),
          }
        : {
            big: null,
            eyebrow:
              status === 'missed'
                ? t('checkIn.missedTitle')
                : t('checkIn.opens', {
                    date: `${formatShortDate(window.opensAt)}, ${formatTime(window.opensAt)}`,
                  }),
            title: t('checkIn.heroLockedTitle'),
          };

  return (
    <GradientPanel style={{ marginTop: 18, padding: 20, borderWidth: 1, borderColor: colors.line }}>
      <Paper range={range}>
        {content.big ? (
          <Text size={26} weight="bold" tracking={-0.03}>
            {content.big}
          </Text>
        ) : (
          <Icon name="lock" size={22} color={colors.mutedSoft} />
        )}
      </Paper>
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
      {status === 'open' ? (
        <Button
          className="mt-[18px]"
          label={t('checkIn.start')}
          onPress={() => router.push('/check-in')}
        />
      ) : null}
    </GradientPanel>
  );
}

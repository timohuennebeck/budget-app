import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { formatShortDate, formatTime, formatWeekRange } from '@/shared/lib/dates';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Pip } from '@/shared/ui/pip';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { useCheckInState } from '../hooks/use-check-in-state';
import { accuracyPercent } from '../lib/check-in-window';

interface QuietRowProps {
  icon: 'lock' | 'check' | 'calendar-blank';
  title: string;
  detail: string;
  onPress?: () => void;
}

function QuietRow({ icon, title, detail, onPress }: QuietRowProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityLabel={title}
      className="flex-row items-center gap-3 rounded-3xl border border-line bg-surface px-4 py-3 opacity-100">
      <View className="size-9 items-center justify-center rounded-full bg-field">
        <Icon name={icon} size={16} color={colors.mutedSoft} />
      </View>
      <View className="flex-1">
        <Text size={15} weight="semibold">
          {title}
        </Text>
        <Text size={13} className="text-subtle">
          {detail}
        </Text>
      </View>
      {onPress ? <Icon name="caret-right" size={12} color={colors.chevron} /> : null}
    </Pressable>
  );
}

// Weekly check-in on Start: a quiet row while locked or done, the most
// prominent card while open, and a pointer to the next date when missed.
export function CheckInCard() {
  const { t } = useTranslation();
  const { status, window, current } = useCheckInState();
  const nextOpen = `${formatShortDate(window.opensAt)}, ${formatTime(window.opensAt)}`;
  const openHistory = () => router.push('/check-in/history');
  const percent = current ? accuracyPercent(current) : null;

  if (status === 'open') {
    return (
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={{ borderRadius: 28, padding: 18, marginTop: 24 }}>
        <View className="flex-row items-center gap-3">
          <View className="flex-1 gap-1">
            <Text size={13} weight="semibold" className="text-white/80">
              {t('checkIn.cardLabel', { range: formatWeekRange(window.week) })}
            </Text>
            <Text size={21} weight="semibold" tracking={-0.02} className="text-white">
              {t('checkIn.cardTitle')}
            </Text>
          </View>
          <Pip pose="reading" size={78} />
        </View>
        <Button
          className="mt-3.5 bg-surface"
          size="md"
          label={t('checkIn.cardAction')}
          variant="outline"
          onPress={() => router.push('/check-in')}
        />
      </LinearGradient>
    );
  }

  return (
    <View className="mt-6">
      {status === 'done' && current ? (
        <QuietRow
          icon="check"
          title={t('checkIn.doneTitle')}
          detail={
            current.skipped || percent === null
              ? t('checkIn.skipped')
              : t('checkIn.doneDetail', { percent })
          }
          onPress={openHistory}
        />
      ) : status === 'missed' ? (
        <QuietRow
          icon="calendar-blank"
          title={t('checkIn.missedTitle')}
          detail={t('checkIn.next', { date: nextOpen })}
          onPress={openHistory}
        />
      ) : (
        <QuietRow
          icon="lock"
          title={t('checkIn.lockedTitle')}
          detail={t('checkIn.opens', { date: nextOpen })}
        />
      )}
    </View>
  );
}

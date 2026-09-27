import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepIntro } from '@/features/onboarding/components/step-intro';
import { GradientPanel } from '@/shared/components/gradient-panel';
import { Screen } from '@/shared/components/screen';
import { formatTimeValue, parseTime, TimePicker } from '@/shared/components/time-picker';
import type { Enums } from '@/shared/lib/database.types';
import { Button } from '@/shared/ui/button';
import { Chip } from '@/shared/ui/chip';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

export interface ReminderValues {
  time: string;
  repeat: Enums<'reminder_repeat'>;
}

interface ReminderScreenProps {
  header: ReactNode;
  title: string;
  initial: ReminderValues;
  /** Builds the CTA label from the chosen time, e.g. "20:30 übernehmen" */
  submitLabel: (time: string) => string;
  onSubmit: (values: ReminderValues) => void;
  /** Onboarding shows Pip with a clock above the picker */
  illustrated?: boolean;
}

/** Daily reminder time and repeat (2p1 in onboarding, 3h in Profil). */
export function ReminderScreen({
  header,
  title,
  initial,
  submitLabel,
  onSubmit,
  illustrated,
}: ReminderScreenProps) {
  const { t } = useTranslation();
  const [time, setTime] = useState(parseTime(initial.time));
  const [repeat, setRepeat] = useState(initial.repeat);
  const formatted = formatTimeValue(time);

  return (
    <Screen
      footer={
        <Button
          label={submitLabel(formatted)}

          haptic="success"
          onPress={() => onSubmit({ time: formatted, repeat })}
        />
      }>
      {header}
      <StepIntro title={title} subtitle={t('reminders.subtitle')} />
      {illustrated ? (
        <GradientPanel
          style={{ marginTop: 18, height: 170, alignItems: 'center', justifyContent: 'center' }}>
          <Pip pose="clock" size={146} />
        </GradientPanel>
      ) : null}
      <TimePicker value={time} onChange={setTime} />
      <Text variant="overline" className="mt-1 px-1">
        {t('reminders.repeat')}
      </Text>
      <View className="mt-2 flex-row gap-2">
        <Chip
          label={t('reminders.daily')}
          size="lg"
          variant={repeat === 'daily' ? 'selected' : 'soft'}
          onPress={() => setRepeat('daily')}
        />
        <Chip
          label={t('reminders.weekdays')}
          size="lg"
          variant={repeat === 'weekdays' ? 'selected' : 'soft'}
          onPress={() => setRepeat('weekdays')}
        />
      </View>
    </Screen>
  );
}

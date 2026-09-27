import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { DateWheelPicker } from '@/shared/components/date-wheel-picker';
import { Screen } from '@/shared/components/screen';
import { formatBirthDate, fromISODate, toISODate } from '@/shared/lib/dates';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Text } from '@/shared/ui/text';

import { useOnboardingStore } from '../data/onboarding-store';
import { ONBOARDING_STEPS } from '../lib/steps';
import { OnboardingHeader } from './onboarding-header';
import { StepIntro } from './step-intro';

// Starts on today's date, 18 years back.
const defaultBirthDate = () => {
  const today = new Date();
  return new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
};

export function BirthdayScreen() {
  const { t } = useTranslation();
  const stored = useOnboardingStore((state) => state.birthDate);
  const firstName = useOnboardingStore((state) => state.firstName);
  const update = useOnboardingStore((state) => state.update);
  const [date, setDate] = useState(() => (stored ? fromISODate(stored) : defaultBirthDate()));

  return (
    <Screen
      footer={
        <Button
          label={t('common.continue')}
          onPress={() => {
            update({ birthDate: toISODate(date) });
            router.push('/sign-up');
          }}
        />
      }>
      <OnboardingHeader step={ONBOARDING_STEPS.birthday} />
      <StepIntro
        title={t('onboarding.birthday.title', { name: firstName })}
        subtitle={t('onboarding.birthday.subtitle')}
      />
      <Card className="mt-6 px-5 pt-[22px] pb-[18px]">
        <Text size={40} weight="semibold" tracking={-0.04}>
          {formatBirthDate(date)}
        </Text>
        <View className="mt-[18px]">
          <DateWheelPicker
            value={date}
            onChange={setDate}
            maxYear={new Date().getFullYear() - 13}
          />
        </View>
      </Card>
    </Screen>
  );
}

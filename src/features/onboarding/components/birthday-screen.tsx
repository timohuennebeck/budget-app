import { router } from 'expo-router';
import { useState } from 'react';
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

const DEFAULT_BIRTH_DATE = new Date(1995, 0, 1);

export function BirthdayScreen() {
  const { t } = useTranslation();
  const stored = useOnboardingStore((state) => state.birthDate);
  const firstName = useOnboardingStore((state) => state.firstName);
  const update = useOnboardingStore((state) => state.update);
  const [date, setDate] = useState(stored ? fromISODate(stored) : DEFAULT_BIRTH_DATE);

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
        <DateWheelPicker value={date} onChange={setDate} maxYear={new Date().getFullYear() - 13} />
      </Card>
    </Screen>
  );
}

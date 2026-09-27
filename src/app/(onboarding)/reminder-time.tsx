import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/steps';
import { ReminderScreen } from '@/features/notifications/components/reminder-screen';

export default function OnboardingReminderTime() {
  const { t } = useTranslation();
  const firstName = useOnboardingStore((state) => state.firstName);
  const time = useOnboardingStore((state) => state.reminderTime);
  const repeat = useOnboardingStore((state) => state.reminderRepeat);
  const update = useOnboardingStore((state) => state.update);

  return (
    <ReminderScreen
      illustrated
      header={<OnboardingHeader step={ONBOARDING_STEPS.reminder} />}
      title={t('reminders.onboardingTitle', { name: firstName })}
      initial={{ time, repeat }}
      submitLabel={(value) => t('reminders.apply', { time: value })}
      onSubmit={(values) => {
        update({ reminderTime: values.time, reminderRepeat: values.repeat, reminderEnabled: true });
        router.push('/action-button');
      }}
    />
  );
}

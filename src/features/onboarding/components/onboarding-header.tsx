import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/shared/components/screen-header';
import { ProgressBar } from '@/shared/ui/progress-bar';
import { Text } from '@/shared/ui/text';

import { ONBOARDING_TOTAL } from '../lib/steps';

/** Back button, progress bar and "x von 9" on top of every onboarding step. */
export function OnboardingHeader({ step }: { step?: number }) {
  const { t } = useTranslation();
  return (
    <ScreenHeader>
      {step ? (
        <>
          <ProgressBar value={step / ONBOARDING_TOTAL} className="flex-1" />
          <Text size={15} className="text-muted-soft">
            {t('onboarding.progress', { step, total: ONBOARDING_TOTAL })}
          </Text>
        </>
      ) : null}
    </ScreenHeader>
  );
}

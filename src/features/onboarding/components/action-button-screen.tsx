import type { ReactNode } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ActionButtonIllustration } from './action-button-illustration';
import { SetupGuideScreen } from './setup-guide-screen';

interface ActionButtonScreenProps {
  header: ReactNode;
  onDone: () => void;
  /** Label of the secondary button, e.g. "Später" */
  laterLabel: string;
}

const STEPS = [
  'onboarding.actionButton.step1',
  'onboarding.actionButton.step2',
  'onboarding.actionButton.step3',
] as const;

/** Explains putting Looop on the iPhone Action Button (2p2 and Profil). */
export function ActionButtonScreen({ header, onDone, laterLabel }: ActionButtonScreenProps) {
  const { t } = useTranslation();
  return (
    <SetupGuideScreen
      header={header}
      illustration={<ActionButtonIllustration />}
      title={t('onboarding.actionButton.title')}
      subtitle={t('onboarding.actionButton.subtitle')}
      steps={STEPS}
      action={{
        kind: 'open',
        label: t('onboarding.actionButton.openSettings'),
        reopenLabel: t('onboarding.actionButton.reopenSettings'),
        // Not available on web, where it throws instead of rejecting.
        onOpen: () =>
          Promise.resolve()
            .then(Linking.openSettings)
            .catch(() => {}),
        onDone,
      }}
      laterLabel={laterLabel}
      onLater={onDone}
    />
  );
}

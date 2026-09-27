import type { ReactNode } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SetupGuideScreen } from '@/features/onboarding/components/setup-guide-screen';

import { ApplePayIllustration } from './apple-pay-illustration';

interface WalletSetupScreenProps {
  header: ReactNode;
  title: string;
  subtitle: string;
  /** Primary button; it opens the Shortcuts app, then calls onDone */
  primaryLabel: string;
  laterLabel: string;
  onDone: () => void;
}

const STEPS = ['wallet.step1', 'wallet.step2', 'wallet.step3', 'wallet.step4'] as const;

// How to log Apple Pay payments automatically: a personal automation in the
// Shortcuts app (Transaction trigger, iOS 17+) that runs "Zahlung eintragen".
// Apps can't create automations themselves, so this walks the user through
// it, during onboarding and in Profil › Apple Pay.
export function WalletSetupScreen({
  header,
  title,
  subtitle,
  primaryLabel,
  laterLabel,
  onDone,
}: WalletSetupScreenProps) {
  const { t } = useTranslation();
  return (
    <SetupGuideScreen
      header={header}
      illustration={<ApplePayIllustration />}
      title={title}
      subtitle={subtitle}
      steps={STEPS}
      note={t('wallet.hint')}
      primaryLabel={primaryLabel}
      onPrimary={() => {
        Linking.openURL('shortcuts://');
        onDone();
      }}
      laterLabel={laterLabel}
      onLater={onDone}
    />
  );
}

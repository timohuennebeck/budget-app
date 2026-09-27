import type { ReactNode } from 'react';
import { useState } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SetupGuideScreen } from '@/features/onboarding/components/setup-guide-screen';
import { formatShortDate } from '@/shared/lib/dates';

import { useLastWalletPayment } from '../hooks/use-last-wallet-payment';
import { ApplePayIllustration } from './apple-pay-illustration';

interface WalletSetupScreenProps {
  header: ReactNode;
  /** Secondary button before Shortcuts was opened, e.g. "Später" */
  laterLabel: string;
  onDone: () => void;
  /** Signed in: say when the last Apple Pay payment arrived */
  showStatus?: boolean;
}

const STEPS = ['wallet.step1', 'wallet.step2', 'wallet.step3'] as const;

// Logging Apple Pay payments automatically: a personal automation in the
// Shortcuts app (Transaction trigger, iOS 17+) that runs "Zahlung erfassen"
// (2p5-b, also Profil › Apple Pay). Apps can't create automations or see
// whether one exists, so opening Shortcuts doesn't move on: back from it,
// the user confirms with "Erledigt". The first payment that arrives is the
// real proof; with showStatus the screen says when the last one came in.
export function WalletSetupScreen({
  header,
  laterLabel,
  onDone,
  showStatus = false,
}: WalletSetupScreenProps) {
  const { t } = useTranslation();
  const [opened, setOpened] = useState(false);
  const { data: lastPayment } = useLastWalletPayment(showStatus);
  const openShortcuts = () => {
    Linking.openURL('shortcuts://');
    setOpened(true);
  };

  return (
    <SetupGuideScreen
      header={header}
      illustration={<ApplePayIllustration />}
      title={t('wallet.title')}
      subtitle={t('wallet.subtitle')}
      steps={STEPS}
      note={
        lastPayment
          ? t('wallet.active', { date: formatShortDate(new Date(lastPayment)) })
          : undefined
      }
      primaryLabel={opened ? t('wallet.done') : t('wallet.openShortcuts')}
      onPrimary={opened ? onDone : openShortcuts}
      laterLabel={opened ? t('wallet.reopen') : laterLabel}
      onLater={opened ? openShortcuts : onDone}
    />
  );
}

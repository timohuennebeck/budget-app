import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { SetupGuideScreen } from '@/features/onboarding/components/setup-guide-screen';
import { formatShortDate } from '@/shared/lib/dates';

import { useLastWalletPayment } from '../hooks/use-last-wallet-payment';
import { ApplePayIllustration } from './apple-pay-illustration';

interface WalletSetupScreenProps {
  header: ReactNode;
  onNext: () => void;
  /** Secondary button, e.g. "Später" or "Schließen" */
  laterLabel: string;
  onLater: () => void;
  /** Signed in: say when the last Apple Pay payment arrived */
  showStatus?: boolean;
}

const STEPS = ['wallet.step1', 'wallet.step2', 'wallet.step3'] as const;

// Page 1 of 2 on logging Apple Pay payments automatically (2p5-b, also
// Profil › Apple Pay): the personal automation in Shortcuts ("Wallet"
// trigger, iOS 17+) that runs "Zahlung erfassen". Page 2 (WalletLinkScreen)
// links the payment's amount and merchant, then opens Shortcuts, so both
// are read before the one trip there. Apps can't see automations; the first
// payment that arrives is the real proof, which showStatus reports.
export function WalletSetupScreen({
  header,
  onNext,
  laterLabel,
  onLater,
  showStatus = false,
}: WalletSetupScreenProps) {
  const { t } = useTranslation();
  const { data: lastPayment } = useLastWalletPayment(showStatus);
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
      action={{ kind: 'next', label: t('common.continue'), onNext }}
      laterLabel={laterLabel}
      onLater={onLater}
    />
  );
}

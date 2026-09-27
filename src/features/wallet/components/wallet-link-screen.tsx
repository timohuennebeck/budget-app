import type { ReactNode } from 'react';
import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SetupGuideScreen } from '@/features/onboarding/components/setup-guide-screen';

import { ShortcutActionIllustration } from './shortcut-action-illustration';

interface WalletLinkScreenProps {
  header: ReactNode;
  onDone: () => void;
  /** Secondary button before Shortcuts was opened, e.g. "Später" */
  laterLabel: string;
}

const STEPS = ['wallet.link1', 'wallet.link2', 'wallet.link3'] as const;

// Page 2 of 2: iOS doesn't fill the action's Betrag and Händler by itself,
// they have to be linked to the payment (Kurzbefehleingabe) once.
export function WalletLinkScreen({ header, onDone, laterLabel }: WalletLinkScreenProps) {
  const { t } = useTranslation();
  return (
    <SetupGuideScreen
      header={header}
      illustration={<ShortcutActionIllustration />}
      title={t('wallet.linkTitle')}
      subtitle={t('wallet.linkSubtitle')}
      steps={STEPS}
      openLabel={t('wallet.openShortcuts')}
      reopenLabel={t('wallet.reopen')}
      onOpen={() => Linking.openURL('shortcuts://').catch(() => {})}
      onDone={onDone}
      laterLabel={laterLabel}
      onLater={onDone}
    />
  );
}

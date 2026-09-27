import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { WalletLinkScreen } from '@/features/wallet/components/wallet-link-screen';
import { ScreenHeader } from '@/shared/components/screen-header';

export default function ApplePayLinkSettings() {
  const { t } = useTranslation();
  return (
    <WalletLinkScreen
      header={<ScreenHeader title="Apple Pay" />}
      laterLabel={t('common.close')}
      // Back past page 1 to Profil.
      onDone={() => router.dismissTo('/profile')}
    />
  );
}

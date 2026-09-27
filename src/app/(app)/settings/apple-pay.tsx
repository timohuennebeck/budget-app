import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { WalletSetupScreen } from '@/features/wallet/components/wallet-setup-screen';
import { ScreenHeader } from '@/shared/components/screen-header';

export default function ApplePaySettings() {
  const { t } = useTranslation();
  return (
    <WalletSetupScreen
      header={<ScreenHeader title="Apple Pay" />}
      title={t('wallet.title')}
      subtitle={t('wallet.subtitle')}
      laterLabel={t('common.close')}
      onDone={() => router.back()}
      showStatus
    />
  );
}

import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ActionButtonScreen } from '@/features/onboarding/components/action-button-screen';
import { ScreenHeader } from '@/shared/components/screen-header';

export default function ActionButtonSettings() {
  const { t } = useTranslation();
  return (
    <ActionButtonScreen
      header={<ScreenHeader title={t('profile.actionButton')} />}
      laterLabel={t('common.close')}
      onDone={() => router.back()}
    />
  );
}

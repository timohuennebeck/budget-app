import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { CurrencyScreen } from '@/features/profile/components/currency-screen';
import { useProfile, useUpdateProfile } from '@/features/profile/hooks/use-profile';
import { ScreenHeader } from '@/shared/components/screen-header';

export default function CurrencySettings() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  if (!profile) return null;

  return (
    <CurrencyScreen
      header={<ScreenHeader title={t('profile.currency')} />}
      initial={profile.currency}
      submitLabel={() => t('common.save')}
      onSubmit={(currency) => {
        update.mutate({ currency });
        router.back();
      }}
    />
  );
}

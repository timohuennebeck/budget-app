import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepIntro } from '@/features/onboarding/components/step-intro';
import { Screen } from '@/shared/components/screen';
import { Button } from '@/shared/ui/button';

import { ApplePayCardIllustration } from './apple-pay-card-illustration';

interface WalletIntroScreenProps {
  header: ReactNode;
  onSetUp: () => void;
  onLater: () => void;
}

/** Offers the Apple Pay automation before explaining the setup (2p4). */
export function WalletIntroScreen({ header, onSetUp, onLater }: WalletIntroScreenProps) {
  const { t } = useTranslation();
  return (
    <Screen
      scroll
      footer={
        <View>
          <Button label={t('onboarding.applePay.setUp')} onPress={onSetUp} />
          <Button
            variant="ghost"
            className="mt-2.5"
            label={t('onboarding.applePay.later')}
            onPress={onLater}
          />
        </View>
      }>
      {header}
      <StepIntro
        title={t('onboarding.applePay.title')}
        subtitle={t('onboarding.applePay.subtitle')}
      />
      <View className="mt-7">
        <ApplePayCardIllustration />
      </View>
    </Screen>
  );
}

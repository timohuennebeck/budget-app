import { router } from 'expo-router';
import { Linking, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepIntro } from '@/features/onboarding/components/step-intro';
import { NumberedSteps } from '@/shared/components/numbered-steps';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

const STEPS = ['wallet.step1', 'wallet.step2', 'wallet.step3', 'wallet.step4'] as const;

// How to log Apple Pay payments automatically: a personal automation in the
// Shortcuts app (Transaction trigger, iOS 17+) that runs "Zahlung eintragen".
// Apps can't create automations themselves, so this walks the user through.
export function WalletSetupScreen() {
  const { t } = useTranslation();
  return (
    <Screen
      scroll
      footer={
        <View>
          <Button
            label={t('wallet.openShortcuts')}
            onPress={() => Linking.openURL('shortcuts://')}
          />
          <Button
            variant="ghost"
            className="mt-2.5"
            label={t('common.close')}
            onPress={() => router.back()}
          />
        </View>
      }>
      <ScreenHeader title="Apple Pay" />
      <StepIntro title={t('wallet.title')} subtitle={t('wallet.subtitle')} />
      <NumberedSteps steps={STEPS} />
      <Text size={14} className="mt-6 text-muted-soft">
        {t('wallet.hint')}
      </Text>
    </Screen>
  );
}

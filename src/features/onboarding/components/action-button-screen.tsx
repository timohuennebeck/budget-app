import type { ReactNode } from 'react';
import { Linking, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { Screen } from '@/shared/components/screen';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

import { ActionButtonIllustration } from './action-button-illustration';
import { StepIntro } from './step-intro';

interface ActionButtonScreenProps {
  header: ReactNode;
  onDone: () => void;
  /** Label of the secondary button, e.g. "Später" */
  laterLabel: string;
}

const STEPS = [
  'onboarding.actionButton.step1',
  'onboarding.actionButton.step2',
  'onboarding.actionButton.step3',
] as const;

/** Explains putting Looop on the iPhone Action Button (2p2 and Profil). */
export function ActionButtonScreen({ header, onDone, laterLabel }: ActionButtonScreenProps) {
  const { t } = useTranslation();
  return (
    <Screen
      scroll
      footer={
        <View>
          <Button
            label={t('onboarding.actionButton.openSettings')}
            onPress={() => {
              Linking.openSettings();
              onDone();
            }}
          />
          <Button variant="ghost" className="mt-2.5" label={laterLabel} onPress={onDone} />
        </View>
      }>
      {header}
      <StepIntro
        title={t('onboarding.actionButton.title')}
        subtitle={t('onboarding.actionButton.subtitle')}
      />
      <ActionButtonIllustration />
      <View className="mt-[22px] gap-3">
        {STEPS.map((key, index) => (
          <View key={key} className="flex-row items-center gap-3">
            <View className="size-[26px] items-center justify-center rounded-full bg-primary-soft">
              <Text size={13} weight="bold" className="text-primary">
                {index + 1}
              </Text>
            </View>
            <Text size={15} className="flex-1 text-ink-soft">
              <Trans i18nKey={key} components={{ b: <Text size={15} weight="semibold" /> }} />
            </Text>
          </View>
        ))}
      </View>
    </Screen>
  );
}

import type { ParseKeys } from 'i18next';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { NumberedSteps } from '@/shared/components/numbered-steps';
import { Screen } from '@/shared/components/screen';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

import { StepIntro } from './step-intro';

interface SetupGuideScreenProps<Key extends ParseKeys> {
  header: ReactNode;
  illustration: ReactNode;
  title: string;
  subtitle: string;
  steps: readonly Key[];
  /** Small print below the steps */
  note?: string;
  primaryLabel: string;
  onPrimary: () => void;
  /** Secondary button, e.g. "Später" or "Schließen" */
  laterLabel: string;
  onLater: () => void;
}

/** Illustrated how-to for an iOS setting the app can't change itself
 * (Action Button, Apple Pay automation), in onboarding and Profil. */
export function SetupGuideScreen<Key extends ParseKeys>({
  header,
  illustration,
  title,
  subtitle,
  steps,
  note,
  primaryLabel,
  onPrimary,
  laterLabel,
  onLater,
}: SetupGuideScreenProps<Key>) {
  return (
    <Screen
      scroll
      footer={
        <View>
          <Button label={primaryLabel} onPress={onPrimary} />
          <Button variant="ghost" className="mt-2.5" label={laterLabel} onPress={onLater} />
        </View>
      }>
      {header}
      <StepIntro title={title} subtitle={subtitle} />
      {illustration}
      <NumberedSteps steps={steps} />
      {note ? (
        <Text size={14} className="mt-5 text-muted-soft">
          {note}
        </Text>
      ) : null}
    </Screen>
  );
}

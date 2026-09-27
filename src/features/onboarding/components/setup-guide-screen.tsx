import type { ParseKeys } from 'i18next';
import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

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
  /** Primary button: open the iOS screen to set it up ("Einstellungen
   * öffnen"), then "Erledigt"; or move on to the next page ("Weiter"). */
  action:
    | { kind: 'open'; label: string; reopenLabel: string; onOpen: () => void; onDone: () => void }
    | { kind: 'next'; label: string; onNext: () => void };
  /** Secondary button until then, e.g. "Später" or "Schließen" */
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
  action,
  laterLabel,
  onLater,
}: SetupGuideScreenProps<Key>) {
  const { t } = useTranslation();
  // The app can't tell whether the setting was made, so opening it doesn't
  // move on. Back from it, "Erledigt" continues and the second button
  // opens it again.
  const [opened, setOpened] = useState(false);
  const open = () => {
    if (action.kind !== 'open') return;
    action.onOpen();
    setOpened(true);
  };
  const buttons =
    action.kind === 'next'
      ? { primary: [action.label, action.onNext], secondary: [laterLabel, onLater] }
      : opened
        ? { primary: [t('common.doneSetUp'), action.onDone], secondary: [action.reopenLabel, open] }
        : { primary: [action.label, open], secondary: [laterLabel, onLater] };
  const [primaryLabel, onPrimary] = buttons.primary as [string, () => void];
  const [secondaryLabel, onSecondary] = buttons.secondary as [string, () => void];
  return (
    <Screen
      scroll
      footer={
        <View>
          <Button label={primaryLabel} onPress={onPrimary} />
          <Button variant="ghost" className="mt-2.5" label={secondaryLabel} onPress={onSecondary} />
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

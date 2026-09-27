import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { type LayoutRectangle, Pressable, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/steps';
import { MeasuredView } from '@/shared/components/measured-view';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Chip } from '@/shared/ui/chip';
import { IconButton } from '@/shared/ui/icon-button';
import { SelectionRing } from '@/shared/ui/selection-ring';
import { Text } from '@/shared/ui/text';

import { type CaptureMode, useCaptureStore } from '../data/capture-store';
import { useCaptureContext } from '../hooks/use-capture-context';
import { useParsePreview } from '../hooks/use-parse-preview';
import { addInput, joinChips, splitChips, toCaptureText } from '../lib/capture-chips';
import { captureHref } from '../lib/capture-routes';
import { CaptureTips, type TipTargets } from './capture-tips';
import { RecognizedBadge } from './recognized-badge';
import { TodayLabel } from './today-label';

const SUGGESTIONS = [
  'capture.suggestionDining',
  'capture.suggestionTicket',
  'capture.suggestionFlights',
] as const;

interface CaptureTextScreenProps {
  mode: CaptureMode;
  /** Prefill, e.g. the search term from "„Lunch“ als Eintrag erfassen" */
  initialText?: string;
  /** Where the × goes in the app */
  onClose: () => void;
}

// "Was hast du ausgegeben?" (2h-b): each entry becomes a chip on "," or
// Return, with live recognition, quick suggestions, and shortcuts to the
// camera and voice capture. In onboarding it's step 3 with the progress bar.
export function CaptureTextScreen({ mode, initialText, onClose }: CaptureTextScreenProps) {
  const { t } = useTranslation();
  const { firstName, currency } = useCaptureContext(mode);
  const text = useCaptureStore((state) => state.text);
  const setText = useCaptureStore((state) => state.setText);
  const tipsSeen = useOnboardingStore((state) => state.captureTipsSeen);
  const markTipsSeen = useOnboardingStore((state) => state.update);
  const preview = useParsePreview(text, mode);

  // Each visit starts a fresh capture unless "Weitere hinzufügen" asked to
  // keep the drafts collected so far.
  useEffect(() => {
    const store = useCaptureStore.getState();
    if (!store.appending) store.start(initialText && toCaptureText(initialText));
  }, [initialText]);

  const showTips = mode === 'onboarding' && !tipsSeen;
  const [focused, setFocused] = useState(false);
  const [targets, setTargets] = useState<TipTargets>({});
  // Coach marks need window coordinates of the controls they point at.
  const measure = (key: keyof TipTargets) => (rect: LayoutRectangle) =>
    setTargets((current) => ({ ...current, [key]: rect }));

  const input = useRef<TextInput>(null);
  const { chips, current } = splitChips(text);
  const update = (next: string[], typing: string) =>
    setText(joinChips({ chips: next, current: typing }));
  const type = (value: string) => {
    const next = addInput(chips, value);
    update(next.chips, next.current);
  };
  const commit = () => type(`${current}\n`);
  const removeChip = (index: number) =>
    update(
      chips.filter((_, other) => other !== index),
      current,
    );
  // Backspace in an empty field brings the last chip back for editing.
  const editLastChip = () => {
    if (current || chips.length === 0) return;
    update(chips.slice(0, -1), chips[chips.length - 1]);
  };
  // A suggestion comes with an amount, so it's added as a finished entry.
  const addSuggestion = (phrase: string) => type(`${current}\n${phrase}\n`);
  const placeholder = t('capture.placeholder');

  return (
    <Screen
      overlay={
        showTips ? (
          <CaptureTips
            targets={targets}
            placeholder={placeholder}
            onFinish={() => markTipsSeen({ captureTipsSeen: true })}
          />
        ) : null
      }
      footer={
        <View className="flex-row gap-2.5">
          <MeasuredView onMeasure={measure('camera')}>
            <IconButton
              icon="camera"
              variant="soft"
              size={60}
              iconSize={24}
              accessibilityLabel={t('capture.camera')}
              onPress={() => router.push(captureHref(mode, 'camera'))}
            />
          </MeasuredView>
          <MeasuredView onMeasure={measure('microphone')}>
            <IconButton
              icon="microphone"
              variant="soft"
              size={60}
              iconSize={24}
              accessibilityLabel={t('capture.voice')}
              onPress={() => router.push(captureHref(mode, 'voice'))}
            />
          </MeasuredView>
          <Button
            className="flex-1"
            label={t('capture.sort')}
            disabled={preview.count === 0}
            onPress={() => router.push(captureHref(mode, 'processing', { source: 'text' }))}
          />
        </View>
      }>
      {mode === 'onboarding' ? (
        <OnboardingHeader step={ONBOARDING_STEPS.firstEntry} />
      ) : (
        <ScreenHeader leading="close" onLeadingPress={onClose} trailing={<TodayLabel />} />
      )}
      <Text variant="display" leading={1.08} className="mt-[22px]">
        {t('capture.title', { name: firstName })}
      </Text>
      <Text variant="body" className="mt-2.5">
        {t('capture.subtitle')}
      </Text>

      <MeasuredView
        onMeasure={measure('text')}
        className="mt-[22px] min-h-[190px] rounded-3xl border border-line-strong bg-surface p-[18px]">
        <SelectionRing visible={focused || !!text} className="rounded-3xl" />
        <Pressable
          onPress={() => input.current?.focus()}
          accessible={false}
          className="flex-1 flex-row flex-wrap content-start items-center gap-2">
          {chips.map((chip, index) => (
            <Chip
              key={`${index}-${chip}`}
              label={chip}
              variant="selected"
              trailingIcon="x"
              onPress={() => removeChip(index)}
            />
          ))}
          <TextInput
            ref={input}
            value={current}
            onChangeText={type}
            onSubmitEditing={commit}
            submitBehavior="submit"
            returnKeyType="next"
            onKeyPress={(event) => {
              if (event.nativeEvent.key !== 'Backspace' || current || !chips.length) return;
              event.preventDefault(); // web would delete a character of the restored chip
              editLastChip();
            }}
            autoFocus={!showTips}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={chips.length ? undefined : placeholder}
            placeholderTextColor={colors.faint}
            selectionColor={colors.primary}
            className="h-10 min-w-[90px] grow font-inter-medium text-ink"
            style={{ fontSize: 19, letterSpacing: -0.3, paddingVertical: 0 }}
          />
        </Pressable>
      </MeasuredView>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {SUGGESTIONS.map((key) => (
          <Chip key={key} label={`+ ${t(key)}`} onPress={() => addSuggestion(t(key))} />
        ))}
      </View>
      <RecognizedBadge
        className="mt-3.5"
        count={preview.count}
        total={preview.total}
        currency={currency}
      />
    </Screen>
  );
}

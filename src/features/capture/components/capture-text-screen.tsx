import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { type LayoutRectangle, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { MeasuredView } from '@/shared/components/measured-view';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { cn } from '@/shared/lib/cn';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Chip } from '@/shared/ui/chip';
import { IconButton } from '@/shared/ui/icon-button';
import { Text } from '@/shared/ui/text';

import { type CaptureMode, useCaptureStore } from '../data/capture-store';
import { useCaptureContext } from '../hooks/use-capture-context';
import { useParsePreview } from '../hooks/use-parse-preview';
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
  /** Where the × goes; onboarding skips ahead instead of closing */
  onClose: () => void;
}

// "Was hast du ausgegeben?" (2h): free text with live recognition, quick
// suggestions, and shortcuts to the camera and voice capture.
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
    if (!store.appending) store.start(initialText);
  }, [initialText]);

  const showTips = mode === 'onboarding' && !tipsSeen;
  const [focused, setFocused] = useState(false);
  const [targets, setTargets] = useState<TipTargets>({});
  // Coach marks need window coordinates of the controls they point at.
  const measure = (key: keyof TipTargets) => (rect: LayoutRectangle) =>
    setTargets((current) => ({ ...current, [key]: rect }));

  const addSuggestion = (phrase: string) =>
    setText(text.trim() ? `${text.trim()}, ${phrase} ` : `${phrase} `);
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
      <ScreenHeader leading="close" onLeadingPress={onClose} trailing={<TodayLabel />} />
      <Text variant="display" leading={1.08} className="mt-[22px]">
        {t('capture.title', { name: firstName })}
      </Text>
      <Text variant="body" className="mt-2.5">
        {t('capture.subtitle')}
      </Text>

      <MeasuredView
        onMeasure={measure('text')}
        className={cn(
          'mt-[22px] min-h-[190px] rounded-3xl bg-surface p-[18px]',
          focused || text ? 'border-2 border-primary' : 'border border-line-strong',
        )}>
        <TextInput
          value={text}
          onChangeText={setText}
          multiline
          autoFocus={!showTips}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          placeholderTextColor={colors.faint}
          selectionColor={colors.primary}
          className="flex-1 font-inter-medium text-[21px] leading-[30px] text-ink"
          style={{ textAlignVertical: 'top', letterSpacing: -0.3 }}
        />
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

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { StatusHero } from '@/shared/components/status-hero';
import { cn } from '@/shared/lib/cn';
import { haptics } from '@/shared/lib/haptics';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Pip } from '@/shared/ui/pip';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { type CaptureMode, useCaptureStore } from '../data/capture-store';
import { useCaptureContext } from '../hooks/use-capture-context';
import { useLiveTranscription, type VoiceError } from '../hooks/use-live-transcription';
import { useParsePreview } from '../hooks/use-parse-preview';
import { captureHref } from '../lib/capture-routes';
import { RecognizedBadge } from './recognized-badge';
import { VoiceTranscript } from './voice-transcript';

/** Shows the seconds left once the session cap is this close. */
const COUNTDOWN_FROM = 10;

// Voice capture (2i). Words appear live while the user speaks (OpenAI
// Realtime, see useLiveTranscription); stopping hands the transcript to
// parse-capture. Every failure falls back to typing.
export function VoiceScreen({ mode }: { mode: CaptureMode }) {
  const { t } = useTranslation();
  const { currency } = useCaptureContext(mode);
  const setText = useCaptureStore((state) => state.setText);
  const voice = useLiveTranscription();
  const preview = useParsePreview(voice.transcript, mode);
  const typeInstead = () => router.dismissTo(captureHref(mode, 'index'));
  // stop() waits for the last words; the user may close the screen meanwhile.
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const finish = async () => {
    if (voice.status === 'stopping') return;
    if (voice.status !== 'listening') return typeInstead();
    const { text, captureId } = await voice.stop();
    if (!mounted.current) return;
    setText(text, captureId);
    if (text.trim()) router.replace(captureHref(mode, 'processing', { source: 'voice' }));
    else typeInstead();
  };

  // The session cap stops the recording like the stop button would.
  const timeUp = voice.secondsLeft === 0;
  useEffect(() => {
    if (timeUp) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeUp]);

  useEffect(() => {
    if (voice.error) haptics.warning();
  }, [voice.error]);

  if (voice.error) return <VoiceErrorView error={voice.error} onType={typeInstead} />;

  const countdown =
    voice.secondsLeft !== null && voice.secondsLeft <= COUNTDOWN_FROM ? voice.secondsLeft : null;

  return (
    <Screen>
      <LinearGradient
        colors={[colors.canvas, '#E6F0FE']}
        locations={[0.3, 1]}
        style={StyleSheet.absoluteFill}
      />
      <ScreenHeader
        leading="close"
        trailing={
          <View className="flex-row items-center gap-2">
            <View
              className={cn(
                'size-2 rounded-full',
                voice.status === 'connecting' ? 'bg-faint' : 'bg-primary',
              )}
            />
            <Text size={15} weight="medium" className="text-primary">
              {voice.status === 'connecting' ? t('capture.connecting') : t('capture.listening')}
            </Text>
          </View>
        }
      />
      <View className="mt-10">
        <VoiceTranscript transcript={voice.transcript} pending={preview.unrecognized.at(-1)} />
      </View>
      <RecognizedBadge
        className="mt-6"
        count={preview.count}
        total={preview.total}
        currency={currency}
      />
      <View className="flex-1 items-center justify-center">
        <Pip pose="basic" size={260} />
      </View>
      <View className="items-center gap-3.5">
        <Pressable
          haptic="press"
          onPress={finish}
          disabled={voice.status === 'stopping'}
          accessibilityLabel={t('capture.stop')}
          className="size-[84px] items-center justify-center rounded-full bg-primary"
          style={{
            boxShadow: '0 0 0 12px rgba(47,124,246,0.14), 0 0 0 26px rgba(47,124,246,0.07)',
          }}>
          <Icon name="stop" weight="fill" size={28} color={colors.white} />
        </Pressable>
        <Text size={15} className="mt-3.5 text-muted-soft">
          {countdown !== null
            ? t('capture.secondsLeft', { count: countdown })
            : t('capture.stopHint')}
        </Text>
      </View>
    </Screen>
  );
}

function VoiceErrorView({ error, onType }: { error: VoiceError; onType: () => void }) {
  const { t } = useTranslation();
  return (
    <Screen
      footer={
        <View>
          {error === 'permission' ? (
            <Button
              className="mb-2.5"
              label={t('common.openSettings')}
              onPress={() => Linking.openSettings()}
            />
          ) : null}
          <Button
            variant={error === 'permission' ? 'ghost' : 'primary'}
            label={t('capture.typeInstead')}
            onPress={onType}
          />
        </View>
      }>
      <ScreenHeader leading="close" />
      <View className="flex-1 items-center justify-center">
        <StatusHero
          pose="dizzy"
          pipSize={150}
          title={t(`capture.voiceErrors.${error}.title`)}
          subtitle={t(`capture.voiceErrors.${error}.subtitle`)}
        />
      </View>
    </Screen>
  );
}

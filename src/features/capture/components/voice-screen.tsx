import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { StatusHero } from '@/shared/components/status-hero';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { cn } from '@/shared/lib/cn';
import { haptics } from '@/shared/lib/haptics';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Pip } from '@/shared/ui/pip';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { type CaptureMode, useCaptureStore } from '../data/capture-store';
import { useVoiceRecording, type VoiceError } from '../hooks/use-voice-recording';
import { captureHref } from '../lib/capture-routes';

/** Shows the seconds left once the cap is this close. */
const COUNTDOWN_FROM = 10;
// Errors from parse-capture by HTTP status, when processing sends us back.
const SERVER_ERRORS: Record<string, VoiceError> = { '401': 'account', '429': 'limit' };

const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

// Voice capture (2i). Recording starts as the screen opens; stopping sends
// the audio to parse-capture, which transcribes and sorts it. Every failure
// falls back to typing.
export function VoiceScreen({ mode }: { mode: CaptureMode }) {
  const { t } = useTranslation();
  const { error: serverError } = useLocalSearchParams<{ error?: string }>();
  const { voiceMaxSeconds } = useAppConfig();
  const setRecording = useCaptureStore((state) => state.setRecording);
  const voice = useVoiceRecording();
  const typeInstead = () => router.dismissTo(captureHref(mode, 'index'));
  const finishing = useRef(false);

  const finish = async () => {
    if (finishing.current) return;
    if (voice.status !== 'recording') return typeInstead();
    finishing.current = true;
    const recording = await voice.stop();
    if (!recording) return typeInstead();
    setRecording(recording);
    router.replace(captureHref(mode, 'processing', { source: 'voice' }));
  };

  // The cap stops the recording like the stop button would.
  const secondsLeft = Math.max(0, voiceMaxSeconds - voice.seconds);
  useEffect(() => {
    if (voice.status === 'recording' && secondsLeft === 0) finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secondsLeft, voice.status]);

  const error: VoiceError | null = serverError
    ? (SERVER_ERRORS[serverError] ?? 'unavailable')
    : voice.error;
  useEffect(() => {
    if (error) haptics.warning();
  }, [error]);

  // The rings around the stop button breathe with the voice.
  const level = voice.level;
  const rings = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(1 + level * 0.35, { duration: 120 }) }],
  }));

  if (error) return <VoiceErrorView error={error} onType={typeInstead} />;

  const recording = voice.status === 'recording';

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
            <View className={cn('size-2 rounded-full', recording ? 'bg-danger' : 'bg-faint')} />
            <Text size={15} weight="medium" className={recording ? 'text-danger' : 'text-muted'}>
              {t('capture.listening')}
            </Text>
          </View>
        }
      />
      <View className="mt-10 items-center gap-2.5 px-2">
        <Text variant="display" className="text-center">
          {t('capture.voiceTitle')}
        </Text>
        <Text variant="body" className="text-center">
          {t('capture.voiceExample')}
        </Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Pip pose="basic" size={240} />
      </View>
      <View className="items-center gap-3.5">
        <Text
          size={17}
          weight="semibold"
          className="text-ink-soft"
          style={{ fontVariant: ['tabular-nums'] }}>
          {clock(voice.seconds)}
        </Text>
        <View className="size-[136px] items-center justify-center">
          <Animated.View
            pointerEvents="none"
            className="absolute size-[136px] rounded-full"
            style={[{ backgroundColor: 'rgba(47,124,246,0.08)' }, rings]}
          />
          <Animated.View
            pointerEvents="none"
            className="absolute size-[110px] rounded-full"
            style={[{ backgroundColor: 'rgba(47,124,246,0.14)' }, rings]}
          />
          <Pressable
            haptic="press"
            onPress={finish}
            accessibilityLabel={t('capture.stop')}
            className="size-[84px] items-center justify-center rounded-full bg-primary">
            <Icon name="stop" weight="fill" size={28} color={colors.white} />
          </Pressable>
        </View>
        <Text size={15} className="text-muted-soft">
          {secondsLeft <= COUNTDOWN_FROM
            ? t('capture.secondsLeft', { count: secondsLeft })
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

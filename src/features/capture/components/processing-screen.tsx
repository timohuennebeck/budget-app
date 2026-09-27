import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useCategories } from '@/features/categories/hooks/use-categories';
import { usePresets } from '@/features/categories/hooks/use-presets';
import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { Screen } from '@/shared/components/screen';
import { haptics } from '@/shared/lib/haptics';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';

import { CaptureError } from '../data/capture-api';
import { type CaptureMode, useCaptureStore } from '../data/capture-store';
import { useCaptureCategories } from '../hooks/use-capture-categories';
import { captureDrafts } from '../lib/capture-drafts';
import { captureHref } from '../lib/capture-routes';
import type { DraftEntry } from '../lib/types';
import { ProcessingSteps } from './processing-steps';
import { ProgressRing } from './progress-ring';

const DURATION_MS = 2400;
const TICK_MS = 60;
const WAITING_CEILING = 0.92;

// "Pip sortiert deine Einträge" (2j). Parses the text or receipt while the
// ring fills (at least), then continues to review (app) or saved (onboarding).
export function ProcessingScreen({ mode }: { mode: CaptureMode }) {
  const { t } = useTranslation();
  const { source } = useLocalSearchParams<{ source?: DraftEntry['source'] }>();
  const categories = useCaptureCategories(mode);
  const presetsPending = usePresets().isPending;
  // Wait for the categories to load, but not for them to be non-empty: an
  // account without categories would otherwise spin here forever.
  const appPending = useCategories(mode === 'app').isPending && mode === 'app';
  const categoriesPending = appPending || presetsPending;
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<DraftEntry[] | null>(null);
  const started = useRef(false);

  useEffect(() => {
    if (started.current || categoriesPending) return;
    started.current = true;
    const { text, photoUri, captureId } = useCaptureStore.getState();

    captureDrafts({
      source: source ?? 'text',
      text,
      photoUri,
      captureId,
      categories,
    })
      .then(setResult)
      .catch((error) => {
        haptics.error();
        const code = error instanceof CaptureError && error.status ? error.status : 500;
        router.replace(captureHref(mode, 'receipt-error', { code: String(code) }));
      });
  }, [categories, categoriesPending, mode, source]);

  // The ring stops short of 100 % until the server has answered.
  const ceiling = result ? 1 : WAITING_CEILING;
  useEffect(() => {
    const timer = setInterval(
      () => setProgress((value) => Math.min(ceiling, value + TICK_MS / DURATION_MS)),
      TICK_MS,
    );
    return () => clearInterval(timer);
  }, [ceiling]);

  useEffect(() => {
    if (progress < 1 || !result) return;
    if (result.length === 0) {
      haptics.warning();
      Alert.alert(t('capture.noAmountTitle'), t('capture.noAmountMessage'));
      router.back();
      return;
    }
    haptics.success();
    useCaptureStore.getState().addDrafts(result);
    if (mode === 'onboarding') useOnboardingStore.getState().addEntries(result);
    router.replace(captureHref(mode, mode === 'onboarding' ? 'saved' : 'review'));
  }, [progress, result, mode, t]);

  const found = result?.length ?? 0;
  const stepState = (threshold: number, next: number) =>
    progress >= next ? 'done' : progress >= threshold ? 'active' : 'pending';

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-[26px]">
        <View>
          <ProgressRing size={250} progress={progress}>
            <Pip pose="cheers-arms" size={140} />
          </ProgressRing>
          <View className="absolute -bottom-1 self-center rounded-full bg-primary px-4 py-[7px]">
            <Text
              size={15}
              weight="semibold"
              className="text-white"
              style={{ fontVariant: ['tabular-nums'] }}>
              {Math.round(progress * 100)} %
            </Text>
          </View>
        </View>
        <Text variant="title" size={30} className="text-center">
          {t('capture.processingTitle')}
        </Text>
        <ProcessingSteps
          steps={[
            { label: t('capture.stepAmounts', { count: found }), state: stepState(0, 0.35) },
            { label: t('capture.stepIncome'), state: stepState(0.35, 0.7) },
            { label: t('capture.stepCategories'), state: stepState(0.7, 1) },
          ]}
        />
      </View>
      <Text size={14.5} className="text-center text-muted-soft">
        {t('capture.secondsLeft', {
          count: Math.max(0, Math.ceil(((1 - progress) * DURATION_MS) / 1000)),
        })}
      </Text>
    </Screen>
  );
}

import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { colors } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { Pip } from '@/shared/ui/pip';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { type CaptureMode, useCaptureStore } from '../data/capture-store';
import { useCaptureContext } from '../hooks/use-capture-context';
import { useParsePreview } from '../hooks/use-parse-preview';
import { useVoiceTranscript } from '../hooks/use-voice-transcript';
import { captureHref } from '../lib/capture-routes';
import { RecognizedBadge } from './recognized-badge';
import { VoiceTranscript } from './voice-transcript';

// Voice capture (2i). Speech recognition is simulated for now (see
// useVoiceTranscript); stopping hands the transcript to the parser.
export function VoiceScreen({ mode }: { mode: CaptureMode }) {
  const { t } = useTranslation();
  const { currency } = useCaptureContext(mode);
  const setText = useCaptureStore((state) => state.setText);
  const { transcript, stop } = useVoiceTranscript(t('capture.voiceSample'));
  const preview = useParsePreview(transcript, mode);

  const finish = () => {
    stop();
    setText(transcript);
    router.replace(captureHref(mode, preview.count ? 'processing' : 'index', { source: 'voice' }));
  };

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
            <View className="size-2 rounded-full bg-primary" />
            <Text size={15} weight="medium" className="text-primary">
              {t('capture.listening')}
            </Text>
          </View>
        }
      />
      <View className="mt-10">
        <VoiceTranscript transcript={transcript} pending={preview.unrecognized.at(-1)} />
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
          accessibilityLabel={t('capture.stop')}
          className="size-[84px] items-center justify-center rounded-full bg-primary"
          style={{
            boxShadow: '0 0 0 12px rgba(47,124,246,0.14), 0 0 0 26px rgba(47,124,246,0.07)',
          }}>
          <Icon name="stop" weight="fill" size={28} color={colors.white} />
        </Pressable>
        <Text size={15} className="mt-3.5 text-muted-soft">
          {t('capture.stopHint')}
        </Text>
      </View>
    </Screen>
  );
}

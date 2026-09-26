import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { StatusHero } from '@/shared/components/status-hero';
import { formatDayLabel, formatTime } from '@/shared/lib/dates';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { Icon, type IconName } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

import type { CaptureMode } from '../data/capture-store';
import { captureHref } from '../lib/capture-routes';

const TIPS: {
  icon: IconName;
  key: 'capture.errorTipLight' | 'capture.errorTipFrame' | 'capture.errorTipSteady';
}[] = [
  { icon: 'sun', key: 'capture.errorTipLight' },
  { icon: 'frame-corners', key: 'capture.errorTipFrame' },
  { icon: 'hand', key: 'capture.errorTipSteady' },
];

/** Unreadable receipt (2z2) with photo tips and the error code. */
export function ReceiptErrorScreen({ mode }: { mode: CaptureMode }) {
  const { t } = useTranslation();
  const { code = '422' } = useLocalSearchParams<{ code?: string }>();
  const now = new Date();

  return (
    <Screen
      footer={
        <View>
          <Button
            label={t('capture.retakePhoto')}
            onPress={() => router.replace(captureHref(mode, 'camera'))}
          />
          <Button
            variant="ghost"
            className="mt-1"
            label={t('capture.typeInstead')}
            onPress={() => router.replace(captureHref(mode, 'index'))}
          />
        </View>
      }>
      <ScreenHeader leading="close" title={t('capture.receipt')} />
      <View className="flex-1 items-center justify-center gap-[22px]">
        <StatusHero
          pose="dizzy"
          pipSize={150}
          title={t('capture.errorTitle')}
          subtitle={t('capture.errorSubtitle')}
        />
        <Card className="gap-2.5 self-stretch px-[18px] py-4">
          {TIPS.map((tip) => (
            <View key={tip.key} className="flex-row items-center gap-3">
              <View className="size-[30px] items-center justify-center rounded-full bg-primary-soft">
                <Icon name={tip.icon} size={15} color={colors.primary} />
              </View>
              <Text size={15} className="text-ink-soft">
                {t(tip.key)}
              </Text>
            </View>
          ))}
        </Card>
        <View className="flex-row items-center gap-2 rounded-full bg-field px-3.5 py-2">
          <Text size={13.5} className="text-muted">
            {t('capture.errorCode', { code })}
          </Text>
          <Text size={13.5} className="text-faint">
            ·
          </Text>
          <Text size={13.5} className="text-muted">
            {`${formatDayLabel(now)} ${formatTime(now)}`}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

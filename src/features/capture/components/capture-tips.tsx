import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { type LayoutRectangle, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { PageDots } from '@/shared/ui/page-dots';
import { Pip, type PipPose } from '@/shared/ui/pip';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

export interface TipTargets {
  text?: LayoutRectangle;
  camera?: LayoutRectangle;
  microphone?: LayoutRectangle;
}

interface Tip {
  target: keyof TipTargets;
  pose: PipPose;
  title: 'capture.tips.textTitle' | 'capture.tips.cameraTitle' | 'capture.tips.voiceTitle';
  body: 'capture.tips.textBody' | 'capture.tips.cameraBody' | 'capture.tips.voiceBody';
}

const TIPS: Tip[] = [
  { target: 'text', pose: 'write', title: 'capture.tips.textTitle', body: 'capture.tips.textBody' },
  {
    target: 'camera',
    pose: 'cheer',
    title: 'capture.tips.cameraTitle',
    body: 'capture.tips.cameraBody',
  },
  {
    target: 'microphone',
    pose: 'mic',
    title: 'capture.tips.voiceTitle',
    body: 'capture.tips.voiceBody',
  },
];

interface CaptureTipsProps {
  targets: TipTargets;
  placeholder: string;
  onFinish: () => void;
}

function Spotlight({
  tip,
  rect,
  placeholder,
}: {
  tip: Tip;
  rect: LayoutRectangle;
  placeholder: string;
}) {
  const style = {
    position: 'absolute' as const,
    left: rect.x,
    top: rect.y,
    width: rect.width,
    height: rect.height,
  };
  if (tip.target === 'text') {
    return (
      <View style={style} className="rounded-3xl border-2 border-primary bg-surface p-[18px]">
        <Text size={21} weight="medium" leading={1.45} className="text-faint">
          {placeholder}
        </Text>
      </View>
    );
  }
  return (
    <View style={style} className="items-center justify-center rounded-full bg-primary-soft">
      <Icon name={tip.target === 'camera' ? 'camera' : 'microphone'} size={24} color="#2F7CF6" />
    </View>
  );
}

// First-run coach marks (2h1–2h3): dims the screen, redraws the highlighted
// control on top and explains it in a card with Pip. Target rects are in
// window coordinates (measureInWindow).
export function CaptureTips({ targets, placeholder, onFinish }: CaptureTipsProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const tip = TIPS[index];
  const rect = targets[tip.target];
  const last = index === TIPS.length - 1;
  if (!rect) return null;

  const below = tip.target === 'text';
  const arrowLeft = tip.target === 'text' ? 40 : rect.x - 20 + rect.width / 2 - 9;

  return (
    <View className="absolute inset-0">
      <View className="absolute inset-0 bg-[#15181F]/65" />
      <Spotlight tip={tip} rect={rect} placeholder={placeholder} />
      <View
        className="absolute right-5 left-5"
        style={below ? { top: rect.y + rect.height + 14 } : { bottom: height - rect.y + 14 }}>
        <View
          className="absolute size-[18px] rounded-[3px]"
          style={{
            left: arrowLeft,
            transform: [{ rotate: '45deg' }],
            backgroundColor: below ? '#DCE8FC' : '#fff',
            ...(below ? { top: -7 } : { bottom: -7 }),
          }}
        />
        <View className="overflow-hidden rounded-[22px] bg-surface">
          <LinearGradient
            colors={['#DCE8FC', '#EAF2FE', '#FFFFFF']}
            locations={[0, 0.55, 1]}
            style={{
              height: 144,
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingBottom: 14,
            }}>
            <Pip pose={tip.pose} size={100} />
          </LinearGradient>
          <View className="gap-3.5 px-4 pt-2 pb-3.5">
            <View className="gap-1">
              <Text size={17} weight="semibold" tracking={-0.015}>
                {t(tip.title)}
              </Text>
              <Text size={14.5} leading={1.45} className="text-muted">
                {t(tip.body)}
              </Text>
            </View>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2.5">
                <PageDots count={TIPS.length} active={index} />
                {!last ? (
                  <Pressable onPress={onFinish} accessibilityLabel={t('common.skip')}>
                    <Text size={13} className="text-subtle">
                      {t('common.skip')}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
              <Button
                size="sm"
                label={last ? t('capture.tips.start') : t('common.continue')}
                onPress={() => (last ? onFinish() : setIndex(index + 1))}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

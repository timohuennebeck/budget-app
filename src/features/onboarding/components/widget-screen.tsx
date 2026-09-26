import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenHeader } from '@/shared/components/screen-header';
import { Screen } from '@/shared/components/screen';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Text } from '@/shared/ui/text';

import { StepIntro } from './step-intro';

interface PlaceholderProps {
  size: number;
  radius: number;
  color: string;
}

function Placeholder({ size, radius, color }: PlaceholderProps) {
  return (
    <View style={{ width: size, height: size, borderRadius: radius, backgroundColor: color }} />
  );
}

/** Home screen mock with the "Heute" widget (2p3, optional step). */
export function WidgetScreen() {
  const { t } = useTranslation();
  const next = () => router.push('/birthday');

  return (
    <Screen
      footer={
        <View>
          <Button label={t('onboarding.widget.add')} onPress={next} />
          <Button
            variant="ghost"
            className="mt-1"
            label={t('onboarding.widget.later')}
            onPress={next}
          />
        </View>
      }>
      <ScreenHeader leading="close" onLeadingPress={next} />
      <StepIntro title={t('onboarding.widget.title')} subtitle={t('onboarding.widget.subtitle')} />
      <View className="mt-[18px] gap-3.5 rounded-[26px] bg-ink p-[18px]">
        <View className="flex-row gap-3.5">
          <View className="h-[156px] w-[156px] rounded-[22px] bg-surface p-3.5">
            <Text size={11} weight="medium" tracking={0.1} className="text-hint uppercase">
              {t('common.today')}
            </Text>
            <View className="mt-1.5 flex-row items-baseline">
              <Text size={30} weight="bold" tracking={-0.04} leading={1}>
                84
              </Text>
              <Text size={17} weight="bold" tracking={-0.04} leading={1}>
                ,00 €
              </Text>
            </View>
            <View className="flex-1" />
            <View className="size-10 items-center justify-center rounded-full bg-primary">
              <Icon name="plus" size={18} color={colors.white} />
            </View>
          </View>
          <View className="flex-1 flex-row flex-wrap content-start gap-3.5">
            {['#23272F', '#2A2F38', '#272B34', '#20242C'].map((color) => (
              <Placeholder key={color} size={63} radius={18} color={color} />
            ))}
          </View>
        </View>
        <View className="flex-row gap-3.5">
          {['#23272F', '#2A2F38', '#272B34'].map((color) => (
            <Placeholder key={color} size={71} radius={19} color={color} />
          ))}
        </View>
        <View className="mt-0.5 flex-row justify-between rounded-3xl bg-[#1E222A] px-3 py-2.5">
          {['#2C313A', '#333842', '#2C313B', '#333843'].map((color) => (
            <Placeholder key={color} size={62} radius={17} color={color} />
          ))}
        </View>
      </View>
    </Screen>
  );
}

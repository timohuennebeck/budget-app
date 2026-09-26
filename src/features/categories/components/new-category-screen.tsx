import { type ReactNode, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepIntro } from '@/features/onboarding/components/step-intro';
import { Screen } from '@/shared/components/screen';
import { cn } from '@/shared/lib/cn';
import { huePalette } from '@/shared/lib/color';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { customHueChoices, customIconChoices } from '../data/category-catalog';
import { CategoryAvatar } from './category-avatar';

export interface NewCategoryValues {
  name: string;
  icon: string;
  hue: number;
}

interface NewCategoryScreenProps {
  header: ReactNode;
  onSubmit: (values: NewCategoryValues) => void;
  loading?: boolean;
}

/** Name, icon and colour for a custom category (2e1). */
export function NewCategoryScreen({ header, onSubmit, loading }: NewCategoryScreenProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(customIconChoices[0]);
  const [hue, setHue] = useState(customHueChoices[0]);
  const palette = huePalette(hue);

  return (
    <Screen
      scroll
      footer={
        <Button
          label={t('categories.add')}
          disabled={!name.trim()}
          loading={loading}
          haptic="success"
          onPress={() => onSubmit({ name: name.trim(), icon, hue })}
        />
      }>
      {header}
      <StepIntro title={t('categories.newTitle')} subtitle={t('categories.newSubtitle')} />

      <View className="mt-6 h-[58px] flex-row items-center gap-3 rounded-[18px] border-2 border-primary bg-surface px-4">
        <CategoryAvatar icon={icon} hue={hue} size={32} />
        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={32}
          placeholder={t('categories.namePlaceholder')}
          placeholderTextColor={colors.faint}
          selectionColor={colors.primary}
          className="flex-1 font-inter-medium text-[19px] text-ink"
        />
      </View>

      <Text size={14} weight="semibold" className="mt-[26px] text-muted-soft">
        {t('categories.icon')}
      </Text>
      <View className="mt-3 flex-row flex-wrap gap-y-3">
        {customIconChoices.map((choice) => {
          const active = choice === icon;
          return (
            <View key={choice} className="w-1/6 items-center">
              <Pressable
                haptic="select"
                accessibilityLabel={choice}
                onPress={() => setIcon(choice)}
                className={cn(
                  'size-[52px] items-center justify-center rounded-full',
                  active ? 'border-2 border-primary' : 'border border-line-strong bg-surface',
                )}
                style={active ? { backgroundColor: palette.background } : undefined}>
                <Icon
                  name={choice}
                  weight="fill"
                  size={23}
                  color={active ? palette.foreground : '#5B6273'}
                />
              </Pressable>
            </View>
          );
        })}
      </View>

      <Text size={14} weight="semibold" className="mt-[26px] text-muted-soft">
        {t('categories.color')}
      </Text>
      <View className="mt-3 flex-row justify-between px-[7px]">
        {customHueChoices.map((choice) => (
          <Pressable
            key={choice}
            haptic="select"
            accessibilityLabel={t('categories.color')}
            onPress={() => setHue(choice)}
            className={cn('size-[38px] rounded-full', choice === hue && 'border-[3px] border-ink')}
            style={{ backgroundColor: huePalette(choice).swatch }}
          />
        ))}
      </View>
    </Screen>
  );
}

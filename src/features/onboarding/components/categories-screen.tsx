import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { usePresetDisplays } from '@/features/categories/hooks/use-category-display';
import { Screen } from '@/shared/components/screen';
import { Button } from '@/shared/ui/button';
import { Chip } from '@/shared/ui/chip';
import { Pip } from '@/shared/ui/pip';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { useOnboardingStore } from '../data/onboarding-store';
import { useSelectedCategoryIds } from '../hooks/use-selected-category-ids';
import { ONBOARDING_STEPS } from '../lib/steps';
import { OnboardingHeader } from './onboarding-header';
import { StepIntro } from './step-intro';

const MIN_CATEGORIES = 3;

export function CategoriesScreen() {
  const { t } = useTranslation();
  const selectedIds = useSelectedCategoryIds();
  const presets = usePresetDisplays();
  const customCategories = useOnboardingStore((state) => state.customCategories);
  const toggleCategory = useOnboardingStore((state) => state.toggleCategory);
  const toggle = (id: string) => toggleCategory(id, selectedIds);

  const options = [
    ...presets.map(({ id, name }) => ({ id, name })),
    ...customCategories.map(({ id, name }) => ({ id, name })),
  ];
  const selected = selectedIds.flatMap((id) => options.filter((option) => option.id === id));
  const available = options.filter((option) => !selectedIds.includes(option.id));

  return (
    <Screen
      scroll
      footer={
        <Button
          label={t('onboarding.categories.continue', { count: selected.length })}
          disabled={selected.length < MIN_CATEGORIES}
          onPress={() => router.push('/budget-type')}
        />
      }>
      <OnboardingHeader step={ONBOARDING_STEPS.categories} />
      <StepIntro
        title={t('onboarding.categories.title')}
        subtitle={t('onboarding.categories.subtitle', { count: MIN_CATEGORIES })}
      />
      <View className="mt-6 flex-row flex-wrap gap-2">
        {selected.map((option) => (
          <Chip
            key={option.id}
            label={option.name}
            size="lg"
            variant="selected"
            trailingIcon="x"
            onPress={() => toggle(option.id)}
          />
        ))}
        {available.map((option) => (
          <Chip
            key={option.id}
            label={`+ ${option.name}`}
            size="lg"
            onPress={() => toggle(option.id)}
          />
        ))}
      </View>
      <Pressable
        className="mt-[18px] self-start"
        onPress={() => router.push('/new-category')}
        accessibilityLabel={t('categories.create')}>
        <Text size={15} weight="medium" className="text-primary">
          {t('categories.create')}
        </Text>
      </Pressable>
      <View className="min-h-[160px] flex-1 items-center justify-center">
        <Pip pose="cheers-arms" size={140} />
      </View>
    </Screen>
  );
}

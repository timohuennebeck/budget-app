import { router } from 'expo-router';

import { NewCategoryScreen } from '@/features/categories/components/new-category-screen';
import { usePresetDisplays } from '@/features/categories/hooks/use-category-display';
import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { useSelectedCategoryIds } from '@/features/onboarding/hooks/use-selected-category-ids';

export default function OnboardingNewCategory() {
  const selected = useSelectedCategoryIds();
  const presets = usePresetDisplays();
  const addCustomCategory = useOnboardingStore((state) => state.addCustomCategory);
  const toggleCategory = useOnboardingStore((state) => state.toggleCategory);
  return (
    <NewCategoryScreen
      header={<OnboardingHeader />}
      suggestions={presets.filter((preset) => !selected.includes(preset.id))}
      onPickSuggestion={(preset) => {
        toggleCategory(preset.id, selected);
        router.back();
      }}
      onSubmit={(values) => {
        addCustomCategory(values, selected);
        router.back();
      }}
    />
  );
}

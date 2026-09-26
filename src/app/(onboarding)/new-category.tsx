import { router } from 'expo-router';

import { NewCategoryScreen } from '@/features/categories/components/new-category-screen';
import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';

export default function OnboardingNewCategory() {
  const addCustomCategory = useOnboardingStore((state) => state.addCustomCategory);
  return (
    <NewCategoryScreen
      header={<OnboardingHeader />}
      onSubmit={(values) => {
        addCustomCategory(values);
        router.back();
      }}
    />
  );
}

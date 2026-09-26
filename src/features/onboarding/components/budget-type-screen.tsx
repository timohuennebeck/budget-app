import { router } from 'expo-router';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/shared/components/screen';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/button';
import { CheckBadge } from '@/shared/ui/check-badge';
import { Pip, type PipPose } from '@/shared/ui/pip';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { useOnboardingStore } from '../data/onboarding-store';
import { ONBOARDING_STEPS } from '../lib/steps';
import { OnboardingHeader } from './onboarding-header';
import { StepIntro } from './step-intro';

interface ModeCardProps {
  title: string;
  description: string;
  tags: string[];
  pose: PipPose;
  selected: boolean;
  onPress: () => void;
}

function ModeCard({ title, description, tags, pose, selected, onPress }: ModeCardProps) {
  return (
    <Pressable
      haptic="select"
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={title}
      className={cn(
        'min-h-[200px] flex-1 justify-end overflow-hidden rounded-[28px] bg-surface px-[22px] py-5',
        selected ? 'border-2 border-primary' : 'border border-line-card',
      )}>
      <View className="absolute top-0 right-3 bottom-0 justify-center">
        <Pip pose={pose} size={120} />
      </View>
      <CheckBadge checked={selected} size={28} className="absolute top-4 right-4" />
      <Text size={26} weight="semibold" tracking={-0.03}>
        {title}
      </Text>
      <Text size={15.5} leading={1.4} className="mt-2 max-w-[196px] text-[#4A5263]">
        {description}
      </Text>
      <View className="mt-3.5 max-w-[200px] flex-row flex-wrap gap-1.5">
        {tags.map((tag) => (
          <View key={tag} className="rounded-full bg-field px-[11px] py-1.5">
            <Text size={13} className="text-[#3B3944]">
              {tag}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

export function BudgetTypeScreen() {
  const { t } = useTranslation();
  const mode = useOnboardingStore((state) => state.budgetMode);
  const update = useOnboardingStore((state) => state.update);

  return (
    <Screen
      footer={
        <View>
          <Button
            label={t('common.continue')}
            onPress={() =>
              router.push(mode === 'monthly' ? '/monthly-budget' : '/category-budgets')
            }
          />
          <Button
            variant="ghost"
            className="mt-1"
            label={t('onboarding.budgetType.skip')}
            onPress={() => {
              update({ budgetMode: 'none' });
              router.push('/notifications');
            }}
          />
        </View>
      }>
      <OnboardingHeader step={ONBOARDING_STEPS.budget} />
      <StepIntro
        title={t('onboarding.budgetType.title')}
        subtitle={t('onboarding.budgetType.subtitle')}
      />
      <View className="mt-5 flex-1 gap-3.5">
        <ModeCard
          title={t('onboarding.budgetType.monthly')}
          description={t('onboarding.budgetType.monthlyDescription')}
          tags={[t('onboarding.budgetType.oneLimit'), t('onboarding.budgetType.noCategory')]}
          pose="account"
          selected={mode === 'monthly'}
          onPress={() => update({ budgetMode: 'monthly' })}
        />
        <ModeCard
          title={t('onboarding.budgetType.perCategory')}
          description={t('onboarding.budgetType.perCategoryDescription')}
          tags={[t('categories.groceries'), t('categories.dining'), t('categories.transport')]}
          pose="write"
          selected={mode !== 'monthly'}
          onPress={() => update({ budgetMode: 'per_category' })}
        />
      </View>
    </Screen>
  );
}

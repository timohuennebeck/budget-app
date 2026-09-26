import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/shared/components/screen';
import { colors, gradients, shadows } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Pip } from '@/shared/ui/pip';

import { useOnboardingStore } from '../data/onboarding-store';
import { ONBOARDING_STEPS } from '../lib/steps';
import { OnboardingHeader } from './onboarding-header';
import { StepIntro } from './step-intro';

export function NameScreen() {
  const { t } = useTranslation();
  const stored = useOnboardingStore((state) => state.firstName);
  const update = useOnboardingStore((state) => state.update);
  const [name, setName] = useState(stored);
  const trimmed = name.trim();

  const submit = () => {
    if (!trimmed) return;
    update({ firstName: trimmed });
    router.push('/currency');
  };

  return (
    <Screen footer={<Button label={t('common.continue')} disabled={!trimmed} onPress={submit} />}>
      <OnboardingHeader step={ONBOARDING_STEPS.name} />
      <StepIntro title={t('onboarding.name.title')} subtitle={t('onboarding.name.subtitle')} />
      <LinearGradient
        colors={gradients.panel}
        style={{
          marginTop: 22,
          borderRadius: 28,
          padding: 18,
          paddingTop: 22,
          alignItems: 'center',
          gap: 16,
        }}>
        <Pip pose="write" size={168} />
        <TextInput
          value={name}
          onChangeText={setName}
          autoFocus
          autoCapitalize="words"
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="next"
          onSubmitEditing={submit}
          placeholder={t('onboarding.name.placeholder')}
          placeholderTextColor={colors.faint}
          selectionColor={colors.primary}
          className="h-[58px] self-stretch rounded-[18px] bg-surface px-[18px] font-inter-medium text-[19px] text-ink"
          style={shadows.card}
        />
      </LinearGradient>
    </Screen>
  );
}

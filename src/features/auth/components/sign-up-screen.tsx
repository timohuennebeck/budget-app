import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { StepIntro } from '@/features/onboarding/components/step-intro';
import { completeOnboarding } from '@/features/onboarding/lib/complete-onboarding';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/steps';
import { profileKey } from '@/features/profile/hooks/use-profile';
import { GradientPanel } from '@/shared/components/gradient-panel';
import { Screen } from '@/shared/components/screen';
import { cn } from '@/shared/lib/cn';
import { haptics } from '@/shared/lib/haptics';
import { queryClient } from '@/shared/lib/query-client';
import { Button } from '@/shared/ui/button';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

import { useSignUp } from '../hooks/use-auth-actions';
import { isValidEmail, MIN_PASSWORD_LENGTH, passwordStrength } from '../lib/password-strength';

const STRENGTH_LABELS = [
  '',
  'auth.strength.weak',
  'auth.strength.fair',
  'auth.strength.strong',
  'auth.strength.veryStrong',
] as const;

export function SignUpScreen() {
  const { t, i18n } = useTranslation();
  const signUp = useSignUp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const strength = passwordStrength(password);
  const valid = isValidEmail(email) && password.length >= MIN_PASSWORD_LENGTH;

  const submit = async () => {
    const draft = useOnboardingStore.getState();
    setSaving(true);
    try {
      const result = await signUp.mutateAsync({
        email: email.trim(),
        password,
        metadata: { first_name: draft.firstName, currency: draft.currency, locale: i18n.language },
      });
      if (!result.session || !result.user) {
        Alert.alert(t('auth.confirmTitle'), t('auth.confirmMessage', { email: email.trim() }));
        return;
      }
      await completeOnboarding(result.user.id, draft);
      await queryClient.invalidateQueries({ queryKey: profileKey(result.user.id) });
      haptics.success();
      router.replace('/plus');
    } catch (error) {
      haptics.error();
      Alert.alert(t('auth.signUpFailed'), error instanceof Error ? error.message : undefined);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen
      footer={
        <View className="gap-3">
          <Button
            label={t('auth.createAccount')}
            disabled={!valid}
            loading={saving}
            onPress={submit}
          />
          <Text size={12.5} leading={1.5} className="px-4 text-center text-[#8A91A0]">
            <Trans
              i18nKey="auth.legalNotice"
              components={{
                terms: (
                  <Text
                    size={12.5}
                    weight="semibold"
                    className="text-ink-soft"
                    onPress={() => router.push('/legal/terms')}
                  />
                ),
                privacy: (
                  <Text
                    size={12.5}
                    weight="semibold"
                    className="text-ink-soft"
                    onPress={() => router.push('/legal/privacy')}
                  />
                ),
              }}
            />
          </Text>
        </View>
      }>
      <OnboardingHeader step={ONBOARDING_STEPS.signUp} />
      <GradientPanel
        style={{ flex: 1, minHeight: 120, alignItems: 'center', justifyContent: 'center' }}>
        <Pip pose="account" size={150} />
      </GradientPanel>
      <StepIntro title={t('auth.signUpTitle')} subtitle={t('auth.signUpSubtitle')} />
      <TextField
        containerClassName="mt-[18px]"
        label={t('auth.email')}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        containerClassName="mt-[18px]"
        label={t('auth.password')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        revealable
        autoComplete="new-password"
        textContentType="newPassword"
      />
      <View className="mt-3 flex-row gap-1.5">
        {[1, 2, 3, 4].map((level) => (
          <View
            key={level}
            className={cn(
              'h-[5px] flex-1 rounded-full',
              strength >= level ? 'bg-primary' : 'bg-line-strong',
            )}
          />
        ))}
      </View>
      <View className="mt-2 flex-row justify-between">
        <Text size={13.5} className="text-muted-soft">
          {t('auth.passwordStrength')}
        </Text>
        {strength ? (
          <Text size={13.5} weight="semibold" className="text-primary">
            {t(STRENGTH_LABELS[strength] as 'auth.strength.weak')}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

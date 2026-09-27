import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Alert, View } from 'react-native';
import { Trans, useTranslation } from 'react-i18next';

import type { LegalKind } from '@/features/legal/data/legal-api';
import { useOnboardingStore } from '@/features/onboarding/data/onboarding-store';
import { OnboardingHeader } from '@/features/onboarding/components/onboarding-header';
import { StepIntro } from '@/features/onboarding/components/step-intro';
import { completeOnboarding } from '@/features/onboarding/lib/complete-onboarding';
import { ONBOARDING_STEPS } from '@/features/onboarding/lib/steps';
import { profileQueries } from '@/features/profile/data/profile-queries';
import { GradientPanel } from '@/shared/components/gradient-panel';
import { Screen } from '@/shared/components/screen';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { useKeyboardVisible } from '@/shared/hooks/use-keyboard-visible';
import { cn } from '@/shared/lib/cn';
import { deviceTimeZone } from '@/shared/lib/dates';
import { haptics } from '@/shared/lib/haptics';
import { queryClient } from '@/shared/lib/query-client';
import { Button } from '@/shared/ui/button';
import { Pip } from '@/shared/ui/pip';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

import { useSignUp } from '../hooks/use-auth-actions';
import { useAuth } from '../lib/auth-provider';
import { isValidEmail, MIN_PASSWORD_LENGTH, passwordStrength } from '../lib/password-strength';

const STRENGTH_LABELS = [
  '',
  'auth.strength.weak',
  'auth.strength.fair',
  'auth.strength.strong',
  'auth.strength.veryStrong',
] as const;

// Inline link in the legal notice: fades while pressed instead of the grey
// highlight iOS draws behind pressable text.
function LegalLink({ kind, children }: { kind: LegalKind; children?: ReactNode }) {
  const [pressed, setPressed] = useState(false);
  return (
    <Text
      size={12.5}
      weight="semibold"
      className="text-ink-soft"
      suppressHighlighting
      style={{ opacity: pressed ? 0.5 : 1 }}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      onPress={() => router.push({ pathname: '/legal/[kind]', params: { kind } })}>
      {children}
    </Text>
  );
}

export function SignUpScreen() {
  const { t, i18n } = useTranslation();
  // Pip makes room for the fields while typing instead of getting squeezed.
  const typing = useKeyboardVisible();
  const signUp = useSignUp();
  const { freeEntries } = useAppConfig();
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const strength = passwordStrength(password);
  const valid = isValidEmail(email) && password.length >= MIN_PASSWORD_LENGTH;

  const submit = async () => {
    const draft = useOnboardingStore.getState();
    setSaving(true);
    try {
      // A retry after saving the answers failed: the account already exists
      // and is signed in, so signing up again would only be rejected. An
      // anonymous user (captured during onboarding) still gets converted.
      let userId = session?.user.is_anonymous ? undefined : session?.user.id;
      if (!userId) {
        const result = await signUp.mutateAsync({
          email: email.trim(),
          password,
          metadata: {
            first_name: draft.firstName,
            currency: draft.currency,
            locale: i18n.language,
            time_zone: deviceTimeZone(),
          },
        });
        if (!result.session || !result.user) {
          Alert.alert(t('auth.confirmTitle'), t('auth.confirmMessage', { email: email.trim() }));
          return;
        }
        userId = result.user.id;
      }
      await completeOnboarding(userId, draft, freeEntries);
      draft.update({ saved: true });
      await queryClient.invalidateQueries({ queryKey: profileQueries.detail(userId).queryKey });
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
          <Text size={12.5} leading={1.5} className="px-4 text-center text-hint">
            <Trans
              i18nKey="auth.legalNotice"
              components={{
                terms: <LegalLink kind="terms" />,
                privacy: <LegalLink kind="privacy" />,
              }}
            />
          </Text>
        </View>
      }>
      <OnboardingHeader step={ONBOARDING_STEPS.signUp} />
      {typing ? null : (
        <GradientPanel
          style={{ flex: 1, minHeight: 120, alignItems: 'center', justifyContent: 'center' }}>
          <Pip pose="account" size={150} />
        </GradientPanel>
      )}
      <StepIntro title={t('auth.signUpTitle')} subtitle={t('auth.signUpSubtitle')} />
      <TextField
        containerClassName="mt-[18px]"
        label={t('auth.email')}
        placeholder={t('auth.emailPlaceholder')}
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
        placeholder={t('auth.newPasswordPlaceholder', { count: MIN_PASSWORD_LENGTH })}
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

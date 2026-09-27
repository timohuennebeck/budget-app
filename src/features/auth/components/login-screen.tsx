import { router } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepIntro } from '@/features/onboarding/components/step-intro';
import { profileQueries } from '@/features/profile/data/profile-queries';
import { useKeyboardVisible } from '@/shared/hooks/use-keyboard-visible';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { haptics } from '@/shared/lib/haptics';
import { queryClient } from '@/shared/lib/query-client';
import { Button } from '@/shared/ui/button';
import { Pip } from '@/shared/ui/pip';
import { TextField } from '@/shared/ui/text-field';

import { useSignIn } from '../hooks/use-auth-actions';
import { isValidEmail } from '../lib/password-strength';

// Sign-in for returning users. Once the profile is onboarded the protected
// routes switch to the app automatically. An account whose onboarding was
// never finished stays in this group, so it continues at the last step.
export function LoginScreen() {
  const { t } = useTranslation();
  const typing = useKeyboardVisible();
  const signIn = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const resume = async (userId: string) => {
    const profile = await queryClient.fetchQuery(profileQueries.detail(userId));
    if (!profile.onboarded_at) router.replace('/done');
  };

  const submit = () =>
    signIn.mutate(
      { email: email.trim(), password },
      {
        onSuccess: (session) => {
          haptics.success();
          resume(session.user.id).catch(() => undefined);
        },
        onError: (error) => {
          haptics.error();
          Alert.alert(t('auth.signInFailed'), error.message);
        },
      },
    );

  return (
    <Screen
      scroll
      footer={
        <Button
          label={t('auth.signIn')}
          disabled={!isValidEmail(email) || !password}
          loading={signIn.isPending}
          onPress={submit}
        />
      }>
      <ScreenHeader />
      {typing ? null : (
        <Pip pose="door-wave" size={150} style={{ alignSelf: 'center', marginTop: 16 }} />
      )}
      <StepIntro title={t('auth.signInTitle')} subtitle={t('auth.signInSubtitle')} />
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
        placeholder={t('auth.passwordPlaceholder')}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        revealable
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={submit}
      />
    </Screen>
  );
}

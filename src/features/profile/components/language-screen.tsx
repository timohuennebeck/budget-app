import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepIntro } from '@/features/onboarding/components/step-intro';
import { OptionRow } from '@/shared/components/option-row';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { findLanguage, languages } from '@/shared/data/languages';
import { changeLanguage } from '@/shared/i18n';
import { Button } from '@/shared/ui/button';
import { Flag } from '@/shared/ui/flag';

import { useProfile, useUpdateProfile } from '../hooks/use-profile';

/** App-Sprache (3i): stored on the profile and applied immediately. */
export function LanguageScreen() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();
  const [selected, setSelected] = useState(findLanguage(profile?.locale ?? 'en').code);

  const save = async () => {
    await changeLanguage(selected);
    update.mutate({ locale: selected }, { onSuccess: () => router.back() });
  };

  return (
    <Screen
      scroll
      footer={<Button label={t('common.save')} loading={update.isPending} onPress={save} />}>
      <ScreenHeader title={t('profile.language')} />
      <StepIntro
        title={t('profile.languageTitle')}
        subtitle={t('profile.languageSubtitle')}
        className="mt-5"
      />
      <View className="mt-5 gap-2.5">
        {languages.map((language) => (
          <OptionRow
            key={language.code}
            title={language.name}
            leading={<Flag code={language.flag} size={44} />}
            selected={language.code === selected}
            onPress={() => setSelected(language.code)}
          />
        ))}
      </View>
    </Screen>
  );
}

import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfile } from '@/features/profile/hooks/use-profile';
import { Screen } from '@/shared/components/screen';
import { findLanguage } from '@/shared/data/languages';
import { changeLanguage } from '@/shared/i18n';
import { colors, shadows } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Flag } from '@/shared/ui/flag';
import { Icon } from '@/shared/ui/icon';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { FloatingEntryCard } from './floating-entry-card';
import { LanguageMenu } from './language-menu';

export function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const insets = useSafeAreaInsets();
  const { data: profile } = useProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const language = findLanguage(i18n.language);

  // Signed in but not onboarded: the app was closed after sign-up (Plus or
  // done step). Starting over would end at sign-up with a taken address, so
  // resume at the last step. Redirect only fires while this screen has focus.
  if (profile && !profile.onboarded_at) return <Redirect href="/done" />;

  return (
    <Screen
      gradient="mist"
      overlay={
        menuOpen ? (
          <>
            <Pressable
              haptic="none"
              accessibilityLabel={t('common.close')}
              onPress={() => setMenuOpen(false)}
              className="absolute inset-0 bg-scrim active:opacity-100"
            />
            <View className="px-5" style={{ paddingTop: insets.top + 50 }}>
              <LanguageMenu
                selected={language.code}
                onSelect={(code) => {
                  changeLanguage(code);
                  setMenuOpen(false);
                }}
              />
            </View>
          </>
        ) : null
      }
      footer={
        <View>
          <Button label={t('onboarding.welcome.start')} onPress={() => router.push('/name')} />
          <View className="mt-4 flex-row justify-center gap-1">
            <Text size={16} className="text-ink-soft">
              {t('onboarding.welcome.haveAccount')}
            </Text>
            <Pressable
              onPress={() => router.push('/login')}
              accessibilityLabel={t('onboarding.welcome.signIn')}>
              <Text size={16} weight="semibold" className="text-primary">
                {t('onboarding.welcome.signIn')}
              </Text>
            </Pressable>
          </View>
        </View>
      }>
      <View className="z-10 mt-1.5 flex-row items-center justify-between">
        <Text size={22} weight="bold" tracking={-0.04}>
          Looop
        </Text>
        <Pressable
          onPress={() => setMenuOpen((open) => !open)}
          accessibilityLabel={t('onboarding.welcome.appLanguage')}
          className="flex-row items-center gap-2 rounded-full bg-surface py-1.5 pr-[13px] pl-[7px]"
          style={shadows.card}>
          <Flag code={language.flag} size={26} />
          <Text size={14.5} weight="semibold" tracking={-0.01}>
            {language.name}
          </Text>
          <Icon name={menuOpen ? 'caret-up' : 'caret-down'} size={11} color={colors.primary} />
        </Pressable>
      </View>

      <View className="relative flex-1">
        <FloatingEntryCard
          icon="shopping-cart"
          hue={150}
          title="REWE"
          subtitle={t('categories.groceries')}
          amount="−40 €"
          tilt={2}
          duration={3600}
          delay={0}
          position={{ top: 20, right: 6 }}
        />
        <FloatingEntryCard
          icon="car-simple"
          hue={255}
          title="Uber"
          subtitle={t('categories.transport')}
          amount="−12 €"
          tilt={-2}
          duration={4200}
          delay={600}
          position={{ top: 150, left: 6 }}
        />
        <FloatingEntryCard
          icon="coffee"
          hue={55}
          title="Flat White"
          subtitle={t('categories.restaurants')}
          amount="−3 €"
          tilt={1.5}
          duration={4400}
          delay={1500}
          position={{ top: 228, right: 6 }}
        />
        <FloatingEntryCard
          icon="fork-knife"
          hue={55}
          title={t('onboarding.welcome.lunch')}
          subtitle={t('categories.restaurants')}
          amount="−18 €"
          tilt={-1.5}
          duration={4800}
          delay={900}
          position={{ top: 306, left: 6 }}
        />
      </View>

      <View>
        <View className="self-start rounded-[10px] bg-primary-soft px-2.5">
          <Text
            size={40}
            weight="semibold"
            tracking={-0.035}
            leading={1.2}
            className="text-primary-dark">
            {t('onboarding.welcome.headlineHighlight')}
          </Text>
        </View>
        <Text size={40} weight="semibold" tracking={-0.035} leading={1.15}>
          {t('onboarding.welcome.headline')}
        </Text>
        <Text size={16.5} leading={1.45} className="mt-3 text-muted-soft">
          {t('onboarding.welcome.subtitle')}
        </Text>
        <View className="mt-4 flex-row items-center gap-2.5">
          <View className="flex-row gap-0.5">
            {[0, 1, 2, 3, 4].map((star) => (
              <Icon key={star} name="star" weight="fill" size={17} color={colors.primary} />
            ))}
          </View>
          <Text size={15} weight="semibold">
            {t('onboarding.welcome.rating')}
          </Text>
          <Text size={15} className="text-subtle">
            {t('onboarding.welcome.reviews')}
          </Text>
        </View>
      </View>
    </Screen>
  );
}

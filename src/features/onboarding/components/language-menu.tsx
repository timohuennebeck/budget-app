import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { type LanguageCode, languages } from '@/shared/data/languages';
import { cn } from '@/shared/lib/cn';
import { shadows } from '@/shared/lib/theme';
import { CheckBadge } from '@/shared/ui/check-badge';
import { Flag } from '@/shared/ui/flag';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

interface LanguageMenuProps {
  selected: string;
  onSelect: (code: LanguageCode) => void;
}

/** Popover list from the welcome screen's language pill (2b). */
export function LanguageMenu({ selected, onSelect }: LanguageMenuProps) {
  const { t } = useTranslation();
  return (
    <View className="w-[262px] gap-0.5 self-end rounded-3xl bg-surface p-2" style={shadows.sheet}>
      <Text variant="overline" className="px-3 pt-2 pb-1.5">
        {t('onboarding.welcome.appLanguage')}
      </Text>
      {languages.map((language) => {
        const active = language.code === selected;
        return (
          <Pressable
            key={language.code}
            haptic="select"
            onPress={() => onSelect(language.code)}
            accessibilityLabel={language.name}
            className={cn(
              'flex-row items-center gap-3 rounded-2xl px-3 py-2.5',
              active && 'bg-primary-wash',
            )}>
            <Flag code={language.flag} size={26} />
            <Text size={16.5} weight={active ? 'semibold' : 'regular'} className="flex-1">
              {language.name}
            </Text>
            {active ? <CheckBadge checked size={20} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

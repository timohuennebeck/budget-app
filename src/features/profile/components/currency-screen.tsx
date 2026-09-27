import { type ReactNode, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepIntro } from '@/features/onboarding/components/step-intro';
import { OptionRow } from '@/shared/components/option-row';
import { Screen } from '@/shared/components/screen';
import { currencies } from '@/shared/data/currencies';
import { currencySymbol } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';
import { Flag } from '@/shared/ui/flag';

interface CurrencyScreenProps {
  header: ReactNode;
  initial: string;
  /** Receives the currency name to build e.g. "Weiter mit Euro" */
  submitLabel: (name: string) => string;
  onSubmit: (currency: string) => void;
}

/** Currency choice (2e14), used in onboarding and Profil › Währung. */
export function CurrencyScreen({ header, initial, submitLabel, onSubmit }: CurrencyScreenProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(initial);

  const name = (code: string) => t(`currencies.${code}` as 'currencies.EUR');

  return (
    <Screen
      scroll
      footer={<Button label={submitLabel(name(selected))} onPress={() => onSubmit(selected)} />}>
      {header}
      <StepIntro title={t('currency.title')} subtitle={t('currency.subtitle')} />
      <View className="mt-[22px] gap-2">
        {currencies.map((currency) => (
          <OptionRow
            key={currency.code}
            title={name(currency.code)}
            subtitle={`${currency.code} · ${currencySymbol(currency.code)}`}
            leading={<Flag code={currency.flag} size={40} />}
            selected={currency.code === selected}
            onPress={() => setSelected(currency.code)}
          />
        ))}
      </View>
    </Screen>
  );
}

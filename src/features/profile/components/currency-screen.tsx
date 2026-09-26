import { type ReactNode, useMemo, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { StepIntro } from '@/features/onboarding/components/step-intro';
import { OptionRow } from '@/shared/components/option-row';
import { Screen } from '@/shared/components/screen';
import { currencies } from '@/shared/data/currencies';
import { currencySymbol } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';
import { Flag } from '@/shared/ui/flag';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

interface CurrencyScreenProps {
  header: ReactNode;
  initial: string;
  /** Receives the currency name to build e.g. "Weiter mit Euro" */
  submitLabel: (name: string) => string;
  onSubmit: (currency: string) => void;
  loading?: boolean;
}

/** Currency choice (2e14), used in onboarding and Profil › Währung. */
export function CurrencyScreen({
  header,
  initial,
  submitLabel,
  onSubmit,
  loading,
}: CurrencyScreenProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(initial);
  const [query, setQuery] = useState('');

  const name = (code: string) => t(`currencies.${code}` as 'currencies.EUR');
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return currencies;
    return currencies.filter(
      (currency) =>
        currency.code.toLowerCase().includes(needle) ||
        name(currency.code).toLowerCase().includes(needle),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return (
    <Screen
      scroll
      footer={
        <Button
          label={submitLabel(name(selected))}
          loading={loading}
          onPress={() => onSubmit(selected)}
        />
      }>
      {header}
      <StepIntro title={t('currency.title')} subtitle={t('currency.subtitle')} />
      <TextField
        containerClassName="mt-[22px]"
        size="md"
        leadingIcon="magnifying-glass"
        value={query}
        onChangeText={setQuery}
        clearable
        placeholder={t('currency.search')}
        autoCorrect={false}
      />
      <Text variant="overline" className="mt-[18px] px-1">
        {t('currency.suggestions')}
      </Text>
      <View className="mt-2.5 gap-2">
        {visible.map((currency) => (
          <OptionRow
            key={currency.code}
            title={name(currency.code)}
            subtitle={`${currency.code} · ${currencySymbol(currency.code)}`}
            leading={<Flag code={currency.flag} size={40} />}
            selected={currency.code === selected}
            onPress={() => setSelected(currency.code)}
          />
        ))}
        {visible.length === 0 ? (
          <Text variant="body" className="px-1 py-4">
            {t('currency.empty', { query })}
          </Text>
        ) : null}
      </View>
    </Screen>
  );
}

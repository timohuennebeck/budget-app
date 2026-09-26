import { type ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StepIntro } from '@/features/onboarding/components/step-intro';
import { AmountStepper, QuickAmounts } from '@/shared/components/amount-stepper';
import { Screen } from '@/shared/components/screen';
import { useAppConfig } from '@/shared/hooks/use-app-config';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';

interface MonthlyBudgetScreenProps {
  header: ReactNode;
  initial: number;
  currency: string;
  submitLabel: string;
  onSubmit: (amount: number) => void;
  loading?: boolean;
}

const QUICK = [800, 1000, 1200, 1500];

/** One amount for everything (2e16), also Profil › Monatsbudget. */
export function MonthlyBudgetScreen({
  header,
  initial,
  currency,
  submitLabel,
  onSubmit,
  loading,
}: MonthlyBudgetScreenProps) {
  const { t } = useTranslation();
  const { peerAverages } = useAppConfig();
  const [amount, setAmount] = useState(initial);
  const money = (value: number) => formatMoney(value, { currency, compact: true });

  return (
    <Screen
      footer={<Button label={submitLabel} loading={loading} onPress={() => onSubmit(amount)} />}>
      {header}
      <StepIntro title={t('budgets.monthlyTitle')} subtitle={t('budgets.monthlySubtitle')} />
      <Card className="mt-7 px-[18px] pt-[26px] pb-[22px]">
        <AmountStepper
          value={amount}
          onChange={setAmount}
          currency={currency}
          step={50}
          hint={t('budgets.peerAverage', { amount: money(peerAverages.monthly) })}
        />
      </Card>
      <QuickAmounts
        className="mt-4"
        options={QUICK.map((value) => ({ label: money(value), value }))}
        selected={amount}
        onSelect={setAmount}
      />
    </Screen>
  );
}

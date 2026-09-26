import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AmountStepper, QuickAmounts } from '@/shared/components/amount-stepper';
import { Sheet, type SheetControls } from '@/shared/components/sheet';
import { formatMoney } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';

interface BudgetSheetBodyProps {
  currency: string;
  /** Current limit, null for no limit */
  initial: number | null;
  /** Typical amount used as the default and to derive quick choices */
  reference: number;
  hint: string;
  onSave: (limit: number | null) => void;
}

interface BudgetSheetProps extends BudgetSheetBodyProps, SheetControls {
  title: string;
}

const NO_LIMIT = -1;

function roundTo(value: number, step: number) {
  return Math.max(step, Math.round(value / step) * step);
}

function BudgetSheetBody({ currency, initial, reference, hint, onSave }: BudgetSheetBodyProps) {
  const { t } = useTranslation();
  const fallback = roundTo(reference || 100, 10);
  const [amount, setAmount] = useState(initial ?? fallback);
  const [choice, setChoice] = useState<number>(initial ?? fallback);

  const quick = [roundTo(fallback * 0.7, 10), fallback, roundTo(fallback * 1.4, 50)];
  const options = [
    ...quick.map((value) => ({ label: formatMoney(value, { currency, compact: true }), value })),
    { label: t('budgets.noLimit'), value: NO_LIMIT },
  ];

  return (
    <>
      <AmountStepper
        size="lg"
        value={amount}
        currency={currency}
        hint={hint}
        onChange={(value) => {
          setAmount(value);
          setChoice(value);
        }}
      />
      <QuickAmounts
        variant="soft"
        className="mt-[22px]"
        options={options}
        selected={choice}
        onSelect={(value) => {
          setChoice(value);
          if (value !== NO_LIMIT) setAmount(value);
        }}
      />
      <Button
        className="mt-[22px]"
        label={t('common.save')}
        haptic="success"
        onPress={() => onSave(choice === NO_LIMIT ? null : amount)}
      />
    </>
  );
}

/** Category limit sheet (2e3 in onboarding, 2w on Start). */
export function BudgetSheet({ open, onClose, title, ...body }: BudgetSheetProps) {
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <BudgetSheetBody {...body} />
    </Sheet>
  );
}

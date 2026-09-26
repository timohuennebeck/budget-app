import { type ReactNode, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryAvatar } from '@/features/categories/components/category-avatar';
import { CategoryPill } from '@/features/categories/components/category-pill';
import type { CategoryDisplay } from '@/features/categories/hooks/use-category-display';
import { useSheet } from '@/shared/components/sheet';
import { formatDayLabel, formatTime } from '@/shared/lib/dates';
import { currencySymbol, formatMoney, parseAmount, roundMoney } from '@/shared/lib/money';
import { colors } from '@/shared/lib/theme';
import { Icon } from '@/shared/ui/icon';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import type { Entry } from '../data/entries-api';
import { entryVisual } from '../lib/entry-display';
import { DateTimeSheet } from './date-time-sheet';

export interface EditableEntry {
  title: string;
  amount: number;
  totalAmount: number | null;
  kind: Entry['kind'];
  categoryId: string | null;
  occurredAt: string;
}

interface EntryEditorProps {
  value: EditableEntry;
  category: CategoryDisplay | undefined;
  currency: string;
  onChange: (patch: Partial<EditableEntry>) => void;
  onCategoryPress: () => void;
}

function amountText(amount: number) {
  return amount.toFixed(2).replace('.', ',');
}

interface DetailRowProps {
  label: string;
  children: ReactNode;
  onPress: () => void;
}

function DetailRow({ label, children, onPress }: DetailRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={label}
      className="min-h-[52px] flex-row items-center gap-3 px-4">
      <Text size={15.5} weight="regular" className="flex-1 text-ink-soft">
        {label}
      </Text>
      <View className="flex-row items-center gap-2">
        {children}
        <Icon name="caret-right" size={12} color={colors.chevron} />
      </View>
    </Pressable>
  );
}

// Editable header + detail rows of an entry (2y). Title and amount are
// inline inputs; category and date open the picker and a date sheet.
export function EntryEditor({
  value,
  category,
  currency,
  onChange,
  onCategoryPress,
}: EntryEditorProps) {
  const { t } = useTranslation();
  const dateSheet = useSheet();
  // Typed text while editing; otherwise the formatted amount.
  const [amountDraft, setAmountDraft] = useState<string | null>(null);
  const visual = entryVisual(value.kind, category);
  const occurred = new Date(value.occurredAt);

  const commitAmount = () => {
    const parsed = amountDraft === null ? null : parseAmount(amountDraft);
    setAmountDraft(null);
    if (!parsed) return;
    // Keep the split ratio when the user's share changes.
    const ratio = value.totalAmount ? value.totalAmount / value.amount : null;
    onChange({ amount: parsed, totalAmount: ratio ? roundMoney(parsed * ratio) : null });
  };

  return (
    <View>
      <View className="mt-[26px] items-center">
        <CategoryAvatar icon={visual.icon} hue={visual.hue} size={56} />
        <TextInput
          value={value.title}
          onChangeText={(title) => onChange({ title })}
          selectionColor={colors.primary}
          className="mt-3 min-w-[120px] text-center font-inter-semibold text-[20px] text-ink"
          style={{ letterSpacing: -0.4, padding: 0 }}
        />
        <View className="mt-2 flex-row items-baseline">
          <Text size={52} weight="bold" tracking={-0.05} leading={1}>
            {value.kind === 'income' ? '+' : '−'}
          </Text>
          <TextInput
            value={amountDraft ?? amountText(value.amount)}
            onChangeText={setAmountDraft}
            onFocus={() => setAmountDraft(amountText(value.amount))}
            onBlur={commitAmount}
            onSubmitEditing={commitAmount}
            keyboardType="decimal-pad"
            returnKeyType="done"
            selectionColor={colors.primary}
            className="font-inter-bold text-ink"
            style={{ fontSize: 52, letterSpacing: -2.6, padding: 0 }}
          />
          <Text size={28} weight="bold" tracking={-0.05} leading={1}>
            {` ${currencySymbol(currency)}`}
          </Text>
        </View>
        {value.totalAmount ? (
          <Text size={14} className="mt-2 text-muted-soft">
            {t('entries.yourHalf', { amount: formatMoney(value.totalAmount, { currency }) })}
          </Text>
        ) : null}
      </View>

      <View className="mt-6">
        {value.kind === 'expense' ? (
          <DetailRow label={t('entries.category')} onPress={onCategoryPress}>
            {category ? (
              <CategoryPill label={category.name} hue={category.hue} />
            ) : (
              <Text size={15.5} className="text-subtle">
                {t('categories.choose')}
              </Text>
            )}
          </DetailRow>
        ) : null}
        <DetailRow label={t('entries.date')} onPress={dateSheet.present}>
          <Text size={15.5} weight="medium">
            {`${formatDayLabel(occurred)}, ${formatTime(occurred)}`}
          </Text>
        </DetailRow>
      </View>

      <DateTimeSheet
        {...dateSheet.controls}
        value={occurred}
        onSave={(date) => {
          onChange({ occurredAt: date.toISOString() });
          dateSheet.dismiss();
        }}
      />
    </View>
  );
}

import { type ReactNode, useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { CategoryAvatar } from '@/features/categories/components/category-avatar';
import { CategoryPill } from '@/features/categories/components/category-pill';
import type { CategoryDisplay } from '@/features/categories/hooks/use-category-display';
import { useSheet } from '@/shared/components/sheet';
import { formatDayLabel, formatTime } from '@/shared/lib/dates';
import { currencySymbol, formatAmountInput, parseAmount } from '@/shared/lib/money';
import { colors } from '@/shared/lib/theme';
import { FittedInput } from '@/shared/ui/fitted-input';
import { Icon } from '@/shared/ui/icon';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import type { Entry } from '../data/entries-api';
import { entryVisual } from '../lib/entry-display';
import { DateTimeSheet } from './date-time-sheet';

export interface EditableEntry {
  title: string;
  amount: number;
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

  // The amount applies while typing, since a footer button doesn't blur the
  // field. entries.amount must be > 0, so while the text isn't a positive
  // amount (empty, or a "-" on Android) the one from before typing stands.
  const [amountBefore, setAmountBefore] = useState(value.amount);
  const typeAmount = (text: string) => {
    setAmountDraft(text);
    const parsed = parseAmount(text);
    onChange({ amount: parsed && parsed > 0 ? parsed : amountBefore });
  };
  const commitAmount = () => setAmountDraft(null);

  return (
    <View>
      <View className="mt-[26px] items-center">
        <CategoryAvatar icon={visual.icon} hue={visual.hue} size={56} />
        <TextInput
          value={value.title}
          onChangeText={(title) => onChange({ title })}
          placeholder={t('entries.titlePlaceholder')}
          placeholderTextColor={colors.faint}
          selectionColor={colors.primary}
          className="mt-3 min-w-[120px] text-center font-inter-semibold text-[20px] text-ink"
          style={{ letterSpacing: -0.4, padding: 0 }}
        />
        <View className="mt-2 flex-row items-baseline">
          <Text size={52} weight="bold" tracking={-0.05} leading={1}>
            {value.kind === 'income' ? '+' : '−'}
          </Text>
          <FittedInput
            size={52}
            value={amountDraft ?? formatAmountInput(value.amount)}
            onChangeText={typeAmount}
            onFocus={() => {
              setAmountBefore(value.amount);
              setAmountDraft(formatAmountInput(value.amount));
            }}
            onBlur={commitAmount}
            onSubmitEditing={commitAmount}
            keyboardType="decimal-pad"
            returnKeyType="done"
            caretHidden
            selectTextOnFocus
            renderValue={(amount) => {
              const [whole, cents] = amount.split(/(?=[.,])/);
              return (
                <>
                  {whole}
                  {cents ? (
                    <Text size={28} weight="bold" tracking={-0.05}>
                      {cents}
                    </Text>
                  ) : null}
                </>
              );
            }}
          />
          <Text size={28} weight="bold" tracking={-0.05} leading={1}>
            {` ${currencySymbol(currency)}`}
          </Text>
        </View>
      </View>

      <View className="mt-6">
        <DetailRow label={t('entries.category')} onPress={onCategoryPress}>
          {category ? (
            <CategoryPill label={category.name} hue={category.hue} />
          ) : (
            <Text size={15.5} className="text-subtle">
              {t('categories.choose')}
            </Text>
          )}
        </DetailRow>
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

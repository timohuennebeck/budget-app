import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { countByCategory, spendByCategory } from '@/features/entries/lib/entry-stats';
import { useRecentEntries } from '@/features/entries/hooks/use-entries';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { cn } from '@/shared/lib/cn';
import { formatMoney, roundMoney } from '@/shared/lib/money';
import { Button } from '@/shared/ui/button';
import { RadioMark } from '@/shared/ui/check-badge';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

import { type CategoryDisplay, useAppCategoryDisplays } from '../hooks/use-category-display';
import { CategoryAvatar } from './category-avatar';

interface CategoryPickerScreenProps {
  initialId: string | null;
  /** Amount of the entry being categorised, for the 30-day preview */
  amount: number;
  currency: string;
  onConfirm: (categoryId: string) => void;
}

// Category choice with last-30-days context (2xd3). The selected row
// previews how its total changes once this entry is added. Every preset and
// own category is listed, the most used in the last 30 days first.
export function CategoryPickerScreen({
  initialId,
  amount,
  currency,
  onConfirm,
}: CategoryPickerScreenProps) {
  const { t } = useTranslation();
  const categories = useAppCategoryDisplays();
  const { data: recent = [] } = useRecentEntries();
  const [selectedId, setSelectedId] = useState(initialId);
  const [query, setQuery] = useState('');

  const totals = useMemo(() => spendByCategory(recent), [recent]);
  const counts = useMemo(() => countByCategory(recent), [recent]);
  const money = (value: number) => formatMoney(value, { currency });
  const needle = query.trim().toLowerCase();
  const matches = (category: CategoryDisplay) =>
    !needle ||
    category.name.toLowerCase().includes(needle) ||
    category.keywords.some((word) => word.startsWith(needle));
  // Sorted once, so rows don't jump while choosing.
  const sorted = useMemo(
    () => [...categories].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0)),
    [categories, counts],
  );
  const visible = sorted.filter(matches);
  const selected = categories.find((category) => category.id === selectedId);

  const renderRow = (category: CategoryDisplay) => {
    const active = category.id === selectedId;
    const total = totals.get(category.id) ?? 0;
    const count = counts.get(category.id) ?? 0;
    const detail = active
      ? t('categories.preview', { from: money(total), to: money(roundMoney(total + amount)) })
      : count
        ? `${t('entries.count', { count })} · ${money(total)}`
        : null;
    return (
      <Pressable
        key={category.id}
        haptic="select"
        accessibilityRole="radio"
        accessibilityState={{ selected: active }}
        accessibilityLabel={category.name}
        onPress={() => setSelectedId(category.id)}
        className={cn(
          'flex-row items-center gap-3.5 rounded-2xl px-3.5 py-[11px]',
          active && 'bg-[#E5F3FF]',
        )}>
        <CategoryAvatar icon={category.icon} hue={category.hue} size={38} />
        <View className="min-w-0 flex-1 gap-[3px]">
          <Text size={15.5} weight="semibold">
            {category.name}
          </Text>
          {detail ? (
            <Text size={13} className={active ? 'text-[#17559B]' : 'text-subtle'}>
              {detail}
            </Text>
          ) : null}
        </View>
        <RadioMark checked={active} />
      </Pressable>
    );
  };

  return (
    <Screen
      footer={
        <Button
          label={selected ? t('categories.apply', { name: selected.name }) : t('categories.choose')}
          disabled={!selected}
          haptic="success"
          onPress={() => selected && onConfirm(selected.id)}
        />
      }>
      <ScreenHeader title={t('categories.category')} />
      <TextField
        containerClassName="mt-3"
        size="md"
        leadingIcon="magnifying-glass"
        value={query}
        onChangeText={setQuery}
        clearable
        placeholder={t('categories.search')}
      />
      <Text size={13} weight="semibold" className="mt-[18px] px-1 text-subtle">
        {t('categories.last30Days')}
      </Text>
      <ScrollView
        className="mt-2 flex-1"
        contentContainerClassName="gap-1.5 pb-4"
        showsVerticalScrollIndicator={false}>
        {visible.map(renderRow)}
      </ScrollView>
    </Screen>
  );
}

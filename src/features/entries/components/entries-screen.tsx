import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, type TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppCategoryDisplays } from '@/features/categories/hooks/use-category-display';
import { useCategoryLookup } from '@/features/categories/hooks/use-category-lookup';
import { categoryIdOf } from '@/features/categories/lib/category-ref';
import { useCurrency } from '@/features/profile/hooks/use-profile';
import { GradientBackground } from '@/shared/components/gradient-background';
import { useSheet } from '@/shared/components/sheet';
import { ChipRow, MonthPill, TabTitle } from '@/shared/components/tab-header';
import { formatMonthLabel, monthRange } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { tabListProps } from '@/shared/lib/tab-insets';
import { Chip } from '@/shared/ui/chip';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

import { useEntries } from '../hooks/use-entries';
import { countByCategory, groupByDay, netTotal } from '../lib/entry-stats';
import { EmptySearch } from './empty-search';
import { EntryList } from './entry-list';
import { MonthSheet } from './month-sheet';

// Einträge (2t): a month of entries grouped by day, with search, category
// filter chips and a month picker.
export function EntriesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const layout = tabListProps(insets.top, 4);
  const { search } = useLocalSearchParams<{ search?: string }>();
  const categories = useAppCategoryDisplays();
  const lookup = useCategoryLookup();
  const searchInput = useRef<TextInput>(null);

  // "Suchen" on Start opens this tab with ?search=1; focus the field and
  // clear the param so the next visit from Start focuses it again.
  useFocusEffect(
    useCallback(() => {
      if (search !== '1') return;
      searchInput.current?.focus();
      router.setParams({ search: undefined });
    }, [search]),
  );

  const monthSheet = useSheet();
  const [month, setMonth] = useState(() => new Date());
  const range = monthRange(month);
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const { data: entries = [] } = useEntries(range);
  const currency = useCurrency();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (categoryId && categoryIdOf(entry) !== categoryId) return false;
      if (!needle) return true;
      const entryCategory = categoryIdOf(entry);
      const categoryLabel = entryCategory ? (lookup.get(entryCategory)?.name ?? '') : '';
      return (
        entry.title.toLowerCase().includes(needle) || categoryLabel.toLowerCase().includes(needle)
      );
    });
  }, [entries, query, categoryId, lookup]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  // Chips only for categories this month actually has, the most used first.
  const chips = useMemo(() => {
    const counts = countByCategory(entries);
    return categories
      .filter((category) => counts.has(category.id) || category.id === categoryId)
      .sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0));
  }, [categories, entries, categoryId]);
  const noResults = filtered.length === 0 && query.trim().length > 0;

  return (
    <View className="flex-1 bg-canvas">
      <GradientBackground name="sky" height={420} />
      {/* Month, title, search and chips stay put; only the list scrolls. */}
      <View style={{ paddingTop: layout.headerPaddingTop, paddingHorizontal: 16 }}>
        <MonthPill label={formatMonthLabel(month)} onPress={monthSheet.present} />
        <TabTitle
          title={t('entries.title')}
          value={formatMoney(netTotal(filtered), { currency, signed: true })}
          count={filtered.length}
        />

        <TextField
          ref={searchInput}
          containerClassName="mt-[18px]"
          shape="pill"
          leadingIcon="magnifying-glass"
          placeholder={t('common.search')}
          value={query}
          onChangeText={setQuery}
          clearable
          returnKeyType="search"
        />
        <ChipRow className="mt-3">
          <Chip
            label={t('entries.all')}
            size="sm"
            variant={categoryId === null ? 'dark' : 'outline'}
            onPress={() => setCategoryId(null)}
          />
          {chips.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              size="sm"
              variant={categoryId === category.id ? 'dark' : 'outline'}
              onPress={() => setCategoryId(categoryId === category.id ? null : category.id)}
            />
          ))}
        </ChipRow>
      </View>

      {noResults ? (
        // Nothing to scroll: the empty state stays put under the search.
        <View className="mt-3.5 flex-1 px-4">
          <EmptySearch query={query.trim()} />
        </View>
      ) : (
        <ScrollView
          className="mt-3.5 flex-1"
          contentInsetAdjustmentBehavior={layout.contentInsetAdjustmentBehavior}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="grow"
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}>
          {groups.length ? (
            <EntryList groups={groups} categories={lookup} currency={currency} />
          ) : (
            <Text variant="body" className="px-1 pt-6 text-center">
              {t('entries.emptyMonth')}
            </Text>
          )}
        </ScrollView>
      )}
      <MonthSheet
        {...monthSheet.controls}
        selected={month}
        onSelect={(next) => {
          setMonth(next);
          monthSheet.dismiss();
        }}
      />
    </View>
  );
}

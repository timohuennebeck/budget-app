import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, type TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppCategoryDisplays } from '@/features/categories/hooks/use-category-display';
import { useCategoryLookup } from '@/features/categories/hooks/use-category-lookup';
import { useCurrency } from '@/features/profile/hooks/use-profile';
import { GradientBackground } from '@/shared/components/gradient-background';
import { useSheet } from '@/shared/components/sheet';
import { formatMonth, monthRange } from '@/shared/lib/dates';
import { formatMoney } from '@/shared/lib/money';
import { colors, shadows } from '@/shared/lib/theme';
import { Chip } from '@/shared/ui/chip';
import { Icon } from '@/shared/ui/icon';
import { IconButton } from '@/shared/ui/icon-button';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';
import { TextField } from '@/shared/ui/text-field';

import { useEntries } from '../hooks/use-entries';
import { groupByDay, netTotal } from '../lib/entry-stats';
import { EmptySearch } from './empty-search';
import { EntryList } from './entry-list';
import { MonthSheet } from './month-sheet';

// Einträge (2t): a month of entries grouped by day, with search, category
// filter chips, a month switcher and a shortcut to the calendar.
export function EntriesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { search } = useLocalSearchParams<{ search?: string }>();
  const categories = useAppCategoryDisplays();
  const lookup = useCategoryLookup();
  const monthSheet = useSheet();
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

  const [month, setMonth] = useState(() => new Date());
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const { data: entries = [] } = useEntries(monthRange(month));
  const currency = useCurrency();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return entries.filter((entry) => {
      if (categoryId && entry.category_id !== categoryId) return false;
      if (!needle) return true;
      const categoryLabel = entry.category_id ? (lookup.get(entry.category_id)?.name ?? '') : '';
      return (
        entry.title.toLowerCase().includes(needle) || categoryLabel.toLowerCase().includes(needle)
      );
    });
  }, [entries, query, categoryId, lookup]);

  const groups = useMemo(() => groupByDay(filtered), [filtered]);
  const noResults = filtered.length === 0 && query.trim().length > 0;

  return (
    <View className="flex-1 bg-canvas">
      <GradientBackground name="sky" height={420} />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerClassName="grow"
        contentContainerStyle={{
          paddingTop: insets.top + 4,
          paddingHorizontal: 16,
          paddingBottom: 32,
        }}
        showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between px-1">
          <Pressable
            onPress={monthSheet.present}
            haptic="none"
            accessibilityLabel={t('entries.chooseMonth')}
            className="flex-row items-center gap-2 rounded-full bg-surface px-3.5 py-[9px]"
            style={shadows.card}>
            <Text size={15} weight="semibold" tracking={-0.01} className="capitalize">
              {formatMonth(month)}
            </Text>
            <Icon name="caret-down" size={11} color={colors.primary} />
          </Pressable>
          <IconButton
            icon="calendar-blank"
            variant="surface"
            size={40}
            iconSize={18}
            accessibilityLabel={t('calendar.title')}
            onPress={() =>
              router.push({ pathname: '/calendar', params: { month: month.toISOString() } })
            }
          />
        </View>

        <View className="mt-[22px] flex-row items-baseline justify-between px-1">
          <Text size={34} weight="bold" tracking={-0.04} leading={1.05}>
            {t('entries.title')}
          </Text>
          <Text size={14.5} className="text-muted">
            <Text size={14.5} weight="semibold">
              {formatMoney(netTotal(filtered), { currency, signed: true })}
            </Text>
            {` · ${filtered.length}`}
          </Text>
        </View>

        <TextField
          ref={searchInput}
          containerClassName="mt-[18px]"
          size="md"
          leadingIcon="magnifying-glass"
          placeholder={t('common.search')}
          value={query}
          onChangeText={setQuery}
          clearable
          returnKeyType="search"
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-4 mt-3"
          // Fixed height: on web a horizontal ScrollView inside a growing
          // column otherwise stretches and pushes the list off-screen.
          style={{ height: 36, flexGrow: 0, flexShrink: 0 }}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, alignItems: 'center' }}>
          <Chip
            label={t('entries.all')}
            size="sm"
            variant={categoryId === null ? 'dark' : 'outline'}
            onPress={() => setCategoryId(null)}
          />
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              size="sm"
              variant={categoryId === category.id ? 'dark' : 'outline'}
              onPress={() => setCategoryId(categoryId === category.id ? null : category.id)}
            />
          ))}
        </ScrollView>

        <View className="mt-3.5 flex-1">
          {noResults ? (
            <EmptySearch
              query={query.trim()}
              onCapture={() =>
                router.push({ pathname: '/capture', params: { text: query.trim() } })
              }
            />
          ) : groups.length ? (
            <EntryList groups={groups} categories={lookup} currency={currency} headers="outside" />
          ) : (
            <Text variant="body" className="px-1 pt-6 text-center">
              {t('entries.emptyMonth')}
            </Text>
          )}
        </View>
      </ScrollView>
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

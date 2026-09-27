import { useEffect, useRef } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { MoneyText } from '@/shared/components/money-text';
import { PageDots } from '@/shared/ui/page-dots';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

export interface BalancePage {
  key: string;
  label: string;
  amount: number;
  /** Small line under the number, e.g. "von 400 €" */
  detail?: string;
  danger?: boolean;
  /** Category pages open their limit sheet on tap */
  categoryId?: string;
}

interface BalancePagerProps {
  pages: BalancePage[];
  currency: string;
  page: number;
  /** Called when the user swipes to another page */
  onPageChange: (page: number) => void;
  onPressCategory: (categoryId: string) => void;
}

/**
 * The big number at the top of Start: what's left this month, then one
 * page per category with a limit. Swipes snap page by page, with dots.
 */
export function BalancePager({
  pages,
  currency,
  page,
  onPageChange,
  onPressCategory,
}: BalancePagerProps) {
  const { width } = useWindowDimensions();
  const ref = useRef<ScrollView>(null);

  // Follow `page` when it changes from outside (tapping the spend bar).
  useEffect(() => {
    ref.current?.scrollTo({ x: page * width, animated: true });
  }, [page, width]);

  return (
    <View className="-mx-4 pt-16 pb-10">
      <ScrollView
        ref={ref}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const next = Math.round(event.nativeEvent.contentOffset.x / width);
          if (next !== page) onPageChange(next);
        }}>
        {pages.map((item) => {
          const body = (
            <>
              <Text size={14.5} weight="medium" className="text-muted" numberOfLines={1}>
                {item.label}
              </Text>
              <MoneyText
                amount={item.amount}
                currency={currency}
                danger={item.danger}
                className="mt-3.5"
              />
              {/* Kept on every page so the pager doesn't change height. */}
              <Text
                size={14}
                weight={item.danger ? 'semibold' : 'medium'}
                className={item.danger ? 'mt-3 text-danger-text' : 'mt-3 text-muted'}>
                {item.detail ?? ' '}
              </Text>
            </>
          );
          const { categoryId } = item;
          return categoryId ? (
            <Pressable
              key={item.key}
              accessibilityLabel={item.label}
              onPress={() => onPressCategory(categoryId)}
              className="items-center px-4"
              style={{ width }}>
              {body}
            </Pressable>
          ) : (
            <View key={item.key} className="items-center px-4" style={{ width }}>
              {body}
            </View>
          );
        })}
      </ScrollView>
      {pages.length > 1 ? (
        <View className="mt-4 items-center">
          <PageDots count={pages.length} active={page} />
        </View>
      ) : null}
    </View>
  );
}

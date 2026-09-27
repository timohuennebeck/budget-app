import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { PageDots } from '@/shared/ui/page-dots';

import type { BudgetCard as BudgetCardData } from '../lib/budget-summary';
import { BudgetCard } from './budget-card';

const GAP = 10;
const EDGE = 16;
const PER_PAGE = 4;

interface BudgetCarouselProps {
  cards: BudgetCardData[];
  currency: string;
  onOpen: (categoryId: string) => void;
  onEdit: (categoryId: string) => void;
}

/** Budget cards in pages of 2×2 that snap one page at a time, with dots (Start). */
export function BudgetCarousel({ cards, currency, onOpen, onEdit }: BudgetCarouselProps) {
  const { width } = useWindowDimensions();
  const [page, setPage] = useState(0);
  const cardWidth = (width - EDGE * 2 - GAP) / 2;
  const pages = Array.from({ length: Math.ceil(cards.length / PER_PAGE) }, (_, index) =>
    cards.slice(index * PER_PAGE, (index + 1) * PER_PAGE),
  );

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        className="-mx-4"
        scrollEventThrottle={32}
        onScroll={(event) =>
          setPage(Math.round(event.nativeEvent.contentOffset.x / Math.max(1, width)))
        }>
        {pages.map((pageCards, index) => (
          <View
            key={index}
            className="flex-row flex-wrap content-start"
            style={{ width, paddingHorizontal: EDGE, gap: GAP, paddingVertical: 1 }}>
            {pageCards.map((card) => (
              <BudgetCard
                key={card.category.id}
                name={card.category.name}
                icon={card.category.icon}
                hue={card.category.hue}
                limit={card.limit}
                remaining={card.remaining}
                currency={currency}
                width={cardWidth}
                onOpen={() => onOpen(card.category.id)}
                onEdit={() => onEdit(card.category.id)}
              />
            ))}
          </View>
        ))}
      </ScrollView>
      {pages.length > 1 ? (
        <View className="mt-3 items-center">
          <PageDots count={pages.length} active={Math.min(page, pages.length - 1)} />
        </View>
      ) : null}
    </View>
  );
}

import { useState } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';

import { PageDots } from '@/shared/ui/page-dots';

import type { BudgetCard as BudgetCardData } from '../lib/budget-summary';
import { BUDGET_CARD_WIDTH, BudgetCard } from './budget-card';

const GAP = 10;
const EDGE = 16;

interface BudgetCarouselProps {
  cards: BudgetCardData[];
  nameFor: (card: BudgetCardData) => string;
  currency: string;
  onEdit: (categoryId: string) => void;
  editingId?: string | null;
}

/** Horizontally snapping budget cards with page dots (Start). */
export function BudgetCarousel({
  cards,
  nameFor,
  currency,
  onEdit,
  editingId,
}: BudgetCarouselProps) {
  const { width } = useWindowDimensions();
  const [offset, setOffset] = useState(0);
  const perPage = Math.max(1, Math.floor((width - EDGE * 2 + GAP) / (BUDGET_CARD_WIDTH + GAP)));
  const pages = Math.max(1, Math.ceil(cards.length / perPage));
  const page = Math.min(pages - 1, Math.round(offset / ((BUDGET_CARD_WIDTH + GAP) * perPage)));

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={BUDGET_CARD_WIDTH + GAP}
        decelerationRate="fast"
        className="-mx-4"
        contentContainerStyle={{ paddingHorizontal: EDGE, gap: GAP, paddingVertical: 1 }}
        scrollEventThrottle={32}
        onScroll={(event) => setOffset(event.nativeEvent.contentOffset.x)}>
        {cards.map((card) => (
          <BudgetCard
            key={card.category.id}
            name={nameFor(card)}
            icon={card.category.icon}
            hue={card.category.hue}
            limit={card.limit}
            remaining={card.remaining}
            currency={currency}
            highlighted={editingId === card.category.id}
            onEdit={() => onEdit(card.category.id)}
          />
        ))}
      </ScrollView>
      {pages > 1 ? (
        <View className="mt-3 items-center">
          <PageDots count={pages} active={page} />
        </View>
      ) : null}
    </View>
  );
}

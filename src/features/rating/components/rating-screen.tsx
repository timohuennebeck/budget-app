import * as StoreReview from 'expo-store-review';
import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { GradientBackground } from '@/shared/components/gradient-background';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Icon } from '@/shared/ui/icon';
import { Pip } from '@/shared/ui/pip';
import { Pressable } from '@/shared/ui/pressable';
import { Text } from '@/shared/ui/text';

import { useRatingPrompt } from '../hooks/use-rating-prompt';

const MAX_LENGTH = 240;

/** Bewertung (2v): stars plus an optional note before the store prompt. */
export function RatingScreen() {
  const { t } = useTranslation();
  const { markAsked } = useRatingPrompt();
  const [rating, setRating] = useState(4);
  const [note, setNote] = useState('');

  const close = () => {
    markAsked();
    // Rating replaced the capture modal, so going back returns to wherever
    // capture was opened from (e.g. the check-in), not always to the tabs.
    router.back();
  };

  const send = async () => {
    if (await StoreReview.hasAction()) await StoreReview.requestReview();
    close();
  };

  return (
    <Screen
      scroll
      footer={
        <View>
          <Button label={t('rating.send')} haptic="success" onPress={send} />
          <Button variant="ghost" className="mt-1" label={t('rating.notNow')} onPress={close} />
        </View>
      }>
      <GradientBackground name="mist" height={440} />
      <ScreenHeader leading="close" onLeadingPress={close} />
      <Pip pose="thumbs-up-stars" size={148} style={{ alignSelf: 'center' }} />
      <Text variant="title" size={28} className="mt-[18px] text-center">
        {t('rating.title')}
      </Text>
      <Text variant="body" className="mx-auto mt-2.5 max-w-[330px] text-center">
        {t('rating.subtitle')}
      </Text>
      <View className="mt-4 flex-row justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <Pressable
            key={star}
            haptic="select"
            accessibilityLabel={`${star}`}
            onPress={() => setRating(star)}
            className="size-12 items-center justify-center">
            <Icon
              name="star"
              weight="fill"
              size={36}
              color={star <= rating ? colors.primary : colors.primarySoft}
            />
          </Pressable>
        ))}
      </View>
      <View className="mt-5 gap-2.5 rounded-3xl border border-line-strong bg-surface px-[18px] py-4">
        <Text size={13} weight="medium" tracking={0.06} className="text-[#8A91A0] uppercase">
          {t('rating.yourReview')}
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          multiline
          maxLength={MAX_LENGTH}
          placeholder={t('rating.placeholder')}
          placeholderTextColor={colors.faint}
          selectionColor={colors.primary}
          className="h-[104px] font-inter text-[16px] leading-[23px] text-ink"
          style={{ textAlignVertical: 'top' }}
        />
        <Text size={12.5} className="self-end text-faint" style={{ fontVariant: ['tabular-nums'] }}>
          {`${note.length} / ${MAX_LENGTH}`}
        </Text>
      </View>
      <Text size={13.5} leading={1.4} className="mt-3 text-muted-soft">
        {t('rating.note')}
      </Text>
    </Screen>
  );
}

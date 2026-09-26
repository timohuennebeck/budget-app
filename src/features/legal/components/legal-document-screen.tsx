import { router } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { formatLongDate } from '@/shared/lib/dates';
import { colors } from '@/shared/lib/theme';
import { Button } from '@/shared/ui/button';
import { Text } from '@/shared/ui/text';

import type { LegalKind } from '../data/legal-api';
import { useLegalDocument } from '../hooks/use-legal-document';

interface Section {
  heading: string;
  body: string;
}

// Legal texts are stored as simple Markdown: "## Heading" followed by
// paragraphs. That's all this renderer needs to support.
function toSections(markdown: string): Section[] {
  return markdown
    .split(/^## /m)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const [heading, ...rest] = chunk.split('\n');
      return { heading: heading.trim(), body: rest.join('\n').trim() };
    });
}

/** Terms of use / privacy policy (2q), loaded from legal_documents. */
export function LegalDocumentScreen({ kind }: { kind: LegalKind }) {
  const { t } = useTranslation();
  const { data: document, isPending } = useLegalDocument(kind);

  return (
    <Screen scroll footer={<Button label={t('legal.understood')} onPress={() => router.back()} />}>
      <ScreenHeader />
      <View className="gap-[18px] px-0.5 pt-5">
        <View className="gap-1.5">
          <Text size={28} weight="semibold" tracking={-0.03} leading={1.08}>
            {t(kind === 'terms' ? 'legal.terms' : 'legal.privacy')}
          </Text>
          {document ? (
            <Text size={13.5} className="text-hint">
              {t('legal.effective', {
                date: formatLongDate(new Date(document.effective_at)),
                version: document.version,
              })}
            </Text>
          ) : null}
        </View>
        {isPending ? <ActivityIndicator color={colors.primary} /> : null}
        {!isPending && !document ? <Text variant="body">{t('legal.unavailable')}</Text> : null}
        {document
          ? toSections(document.content_md).map((section) => (
              <View key={section.heading} className="gap-[7px]">
                <Text size={16} weight="semibold">
                  {section.heading}
                </Text>
                <Text size={14.5} leading={1.55} className="text-ink-soft">
                  {section.body}
                </Text>
              </View>
            ))
          : null}
      </View>
    </Screen>
  );
}

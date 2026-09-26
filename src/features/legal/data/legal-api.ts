import Constants from 'expo-constants';
import { Platform } from 'react-native';

import type { Enums } from '@/shared/lib/database.types';
import { supabase } from '@/shared/lib/supabase';

export type LegalKind = Enums<'legal_doc_kind'>;

// Newest effective document of a kind, preferring the app language and
// falling back to English.
export async function fetchLegalDocument(kind: LegalKind, locale: string) {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('kind', kind)
    .in('locale', [locale, 'en'])
    .lte('effective_at', new Date().toISOString())
    .order('effective_at', { ascending: false });
  if (error) throw error;
  return data.find((document) => document.locale === locale) ?? data[0] ?? null;
}

/** Records that the signed-in user accepted the current terms and privacy policy. */
export async function acceptLegalDocuments(profileId: string, locale: string) {
  const documents = await Promise.all([
    fetchLegalDocument('terms', locale),
    fetchLegalDocument('privacy', locale),
  ]);
  const rows = documents
    .filter((document) => document !== null)
    .map((document) => ({
      profile_id: profileId,
      document_id: document.id,
      app_version: Constants.expoConfig?.version ?? null,
      platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : ('web' as const),
    }));
  if (rows.length === 0) return;

  const { error } = await supabase
    .from('legal_acceptances')
    .upsert(rows, { onConflict: 'profile_id,document_id', ignoreDuplicates: true });
  if (error) throw error;
}

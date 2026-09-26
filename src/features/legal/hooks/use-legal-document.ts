import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { fetchLegalDocument, type LegalKind } from '../data/legal-api';

export function useLegalDocument(kind: LegalKind) {
  const { i18n } = useTranslation();
  return useQuery({
    queryKey: ['legal', kind, i18n.language],
    queryFn: () => fetchLegalDocument(kind, i18n.language),
    staleTime: Infinity,
  });
}

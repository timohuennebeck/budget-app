import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import type { LegalKind } from '../data/legal-api';
import { legalQueries } from '../data/legal-queries';

export function useLegalDocument(kind: LegalKind) {
  const { i18n } = useTranslation();
  return useQuery({ ...legalQueries.document(kind, i18n.language), staleTime: Infinity });
}

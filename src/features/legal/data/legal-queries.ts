import { createQueryKeys } from '@lukemorales/query-key-factory';

import { fetchLegalDocument, type LegalKind } from './legal-api';

export const legalQueries = createQueryKeys('legal', {
  document: (kind: LegalKind, locale: string) => ({
    queryKey: [kind, locale],
    queryFn: () => fetchLegalDocument(kind, locale),
  }),
});

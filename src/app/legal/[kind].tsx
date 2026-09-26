import { useLocalSearchParams } from 'expo-router';

import type { LegalKind } from '@/features/legal/data/legal-api';
import { LegalDocumentScreen } from '@/features/legal/components/legal-document-screen';

export default function LegalRoute() {
  const { kind } = useLocalSearchParams<{ kind: LegalKind }>();
  return <LegalDocumentScreen kind={kind === 'privacy' ? 'privacy' : 'terms'} />;
}

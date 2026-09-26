import { createQueryKeys } from '@lukemorales/query-key-factory';

import { fetchProfile } from './profile-api';

export const profileQueries = createQueryKeys('profile', {
  detail: (userId: string) => ({ queryKey: [userId], queryFn: () => fetchProfile(userId) }),
});

import 'expo-sqlite/localStorage/install';

import { createJSONStorage } from 'zustand/middleware';

// Zustand stores persist through the same expo-sqlite backed localStorage
// that the Supabase client uses for sessions.
export const persistStorage = createJSONStorage(() => localStorage);

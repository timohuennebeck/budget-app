import { createMMKV } from 'react-native-mmkv';
import { createJSONStorage } from 'zustand/middleware';

/** The app's key-value store: MMKV on iOS and Android, localStorage on web. */
export const storage = createMMKV();

interface KeyValueStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

// Synchronous getItem/setItem/removeItem, the shape both the Supabase auth
// client and zustand's persist middleware expect.
export const keyValueStorage: KeyValueStorage = {
  getItem: (key) => storage.getString(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => {
    storage.remove(key);
  },
};

export const persistStorage = createJSONStorage(() => keyValueStorage);

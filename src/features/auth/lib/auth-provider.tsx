import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { queryClient } from '@/shared/lib/query-client';
import { supabase } from '@/shared/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({ session: null, isLoading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      setSession(next);
      // Drop cached user data when someone signs out or switches accounts.
      if (event === 'SIGNED_OUT') queryClient.clear();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  return <AuthContext.Provider value={{ session, isLoading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

/** The signed-in user's id, or '' while signed out (writes then fail RLS). */
export function useUserId() {
  const { session } = useAuth();
  return session?.user.id ?? '';
}

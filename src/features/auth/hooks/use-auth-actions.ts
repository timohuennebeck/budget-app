import { useMutation } from '@tanstack/react-query';

import { deletePushToken } from '@/features/notifications/data/notifications-api';
import { savedPushToken } from '@/features/notifications/lib/push';
import { supabase } from '@/shared/lib/supabase';

export interface Credentials {
  email: string;
  password: string;
}

export interface SignUpInput extends Credentials {
  metadata: { first_name: string; currency: string; locale: string; time_zone: string };
}

export function useSignIn() {
  return useMutation({
    mutationFn: async ({ email, password }: Credentials) => {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.session;
    },
  });
}

// Creates the account. Someone who captured during onboarding is already an
// anonymous user: their e-mail and password are attached to that user, so
// everything captured so far stays theirs. `session` is null while the
// address still needs confirming.
export function useSignUp() {
  return useMutation({
    mutationFn: async ({ email, password, metadata }: SignUpInput) => {
      const { data: current } = await supabase.auth.getSession();
      if (current.session?.user.is_anonymous) {
        const { data, error } = await supabase.auth.updateUser({ email, password, data: metadata });
        if (error) throw error;
        if (!data.user.email) return { user: data.user, session: null };
        // New token without the anonymous claim.
        const { data: refreshed } = await supabase.auth.refreshSession();
        return { user: data.user, session: refreshed.session };
      }
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: metadata },
      });
      if (error) throw error;
      return data;
    },
  });
}

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      // Stop pushes to this device while the session can still delete the token.
      const token = savedPushToken.get();
      if (token) await deletePushToken(token).catch(() => {});
      savedPushToken.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw error;
      savedPushToken.clear();
      await supabase.auth.signOut({ scope: 'local' });
    },
  });
}

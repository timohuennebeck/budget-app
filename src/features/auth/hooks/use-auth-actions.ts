import { useMutation } from '@tanstack/react-query';

import { supabase } from '@/shared/lib/supabase';

export interface Credentials {
  email: string;
  password: string;
}

export interface SignUpInput extends Credentials {
  metadata: { first_name: string; currency: string; locale: string };
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

export function useSignUp() {
  return useMutation({
    mutationFn: async ({ email, password, metadata }: SignUpInput) => {
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
      await supabase.auth.signOut({ scope: 'local' });
    },
  });
}

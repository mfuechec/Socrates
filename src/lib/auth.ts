/**
 * Authentication helpers
 * Provides utility functions for auth operations
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from './supabase';

export type SupabaseClient = ReturnType<typeof createClientComponentClient<Database>>;

/**
 * Sign in with email
 */
export async function signInWithEmail(email: string, password: string) {
  const supabase = createClientComponentClient<Database>();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign up with email
 */
export async function signUpWithEmail(email: string, password: string) {
  const supabase = createClientComponentClient<Database>();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) throw error;
  return data;
}

/**
 * Sign in with Google OAuth
 */
export async function signInWithGoogle() {
  const supabase = createClientComponentClient<Database>();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) throw error;
  return data;
}

/**
 * Sign out
 */
export async function signOut() {
  const supabase = createClientComponentClient<Database>();
  const { error } = await supabase.auth.signOut();

  if (error) throw error;
}

/**
 * Get current user
 */
export async function getCurrentUser() {
  const supabase = createClientComponentClient<Database>();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Get current session
 */
export async function getSession() {
  const supabase = createClientComponentClient<Database>();
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

/**
 * AuthButton Component
 * Displays sign in/sign out button based on auth state
 */

import { useState } from 'react';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '@/lib/supabase';

export default function AuthButton() {
  const session = useSession();
  const supabase = useSupabaseClient<Database>();
  const [loading, setLoading] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const handleSignIn = async () => {
    try {
      setLoading(true);
      const email = prompt('Enter your email:');
      if (!email) {
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}`,
        },
      });

      if (error) throw error;
      alert('Check your email for the login link!');
    } catch (error: any) {
      console.error('Sign in error:', error);
      alert('Failed to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();

      if (error) throw error;
    } catch (error: any) {
      console.error('Sign out error:', error);
      alert('Failed to sign out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!editedName.trim()) {
      setIsEditingName(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.updateUser({
        data: { full_name: editedName.trim() }
      });

      if (error) throw error;

      // Refresh the session to get the updated user metadata
      await supabase.auth.refreshSession();

      setIsEditingName(false);
    } catch (error: any) {
      console.error('Update name error:', error);
      alert('Failed to update name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (session) {
    // User is signed in - show editable username
    const user = session.user;
    const email = user.email || 'Unknown';
    const displayName = user.user_metadata?.full_name || email.split('@')[0];

    if (isEditingName) {
      return (
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleUpdateName();
              if (e.key === 'Escape') setIsEditingName(false);
            }}
            placeholder={displayName}
            disabled={loading}
            className="flex-1 px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <button
            onClick={handleUpdateName}
            disabled={loading}
            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
            title="Save"
          >
            ✓
          </button>
          <button
            onClick={() => setIsEditingName(false)}
            disabled={loading}
            className="text-xs text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            title="Cancel"
          >
            ✕
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={() => {
          setEditedName(displayName);
          setIsEditingName(true);
        }}
        className="flex-1 min-w-0 text-center hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        title="Click to edit name"
      >
        <p className="text-sm font-semibold text-heading truncate">
          {displayName}
        </p>
      </button>
    );
  }

  // User is signed out
  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      className="w-full py-2 px-3 text-sm font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors"
      title="Sign in to save your progress"
    >
      {loading ? 'Signing in...' : '🔐 Sign In'}
    </button>
  );
}

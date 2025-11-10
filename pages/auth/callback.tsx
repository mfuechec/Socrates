/**
 * OAuth Callback Handler
 * Handles the redirect from OAuth providers (Google, etc.)
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/lib/supabase';

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const supabase = createClientComponentClient<Database>();

      // Exchange the code for a session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error('Auth callback error:', error);
        router.push('/?error=auth_failed');
        return;
      }

      if (session) {
        // Successfully authenticated, redirect to home
        router.push('/');
      } else {
        // No session, redirect with error
        router.push('/?error=no_session');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Completing sign in...</p>
      </div>
    </div>
  );
}

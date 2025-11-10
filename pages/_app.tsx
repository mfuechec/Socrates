import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { SessionContextProvider } from '@supabase/auth-helpers-react'
import { useState } from 'react'
import type { Database } from '@/lib/supabase'

export default function App({ Component, pageProps }: AppProps) {
  // Create supabase client once on mount
  const [supabase] = useState(() => createClientComponentClient<Database>())

  return (
    <SessionContextProvider
      supabaseClient={supabase}
      initialSession={pageProps.initialSession}
    >
      <Component {...pageProps} />
    </SessionContextProvider>
  )
}

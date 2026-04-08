import { useState, useEffect, useCallback } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  configured: boolean
}

export function useAuth() {
  const configured = isSupabaseConfigured()
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: configured,
    configured,
  })

  useEffect(() => {
    if (!configured) {
      setState(s => ({ ...s, loading: false }))
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        configured: true,
      })
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        configured: true,
      })
    })

    return () => subscription.unsubscribe()
  }, [configured])

  const signInWithGoogle = useCallback(async () => {
    if (!configured) return
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    })
  }, [configured])

  const signOut = useCallback(async () => {
    if (!configured) return
    await supabase.auth.signOut()
  }, [configured])

  return {
    ...state,
    signInWithGoogle,
    signOut,
    isAuthenticated: Boolean(state.user),
  }
}

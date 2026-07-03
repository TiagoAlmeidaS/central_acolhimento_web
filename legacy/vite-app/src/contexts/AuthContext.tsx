import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
  isConfigured: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const isConfigured = isSupabaseConfigured()

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false)
      return
    }
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setLoading(false)
    })
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [isConfigured])

  const signInWithPassword = useCallback(
    async (email: string, password: string) => {
      if (!isConfigured) return { error: new Error('Supabase não configurado') }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      return { error: error ?? null }
    },
    [isConfigured]
  )

  const signInWithGoogle = useCallback(async () => {
    if (!isConfigured) return { error: new Error('Supabase não configurado') }
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
    return { error: error ?? null }
  }, [isConfigured])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    const { data: { session: s } } = await supabase.auth.getSession()
    return s?.access_token ?? null
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      isConfigured,
      signInWithPassword,
      signInWithGoogle,
      signOut,
      getAccessToken,
    }),
    [
      session,
      loading,
      isConfigured,
      signInWithPassword,
      signInWithGoogle,
      signOut,
      getAccessToken,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (ctx == null) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

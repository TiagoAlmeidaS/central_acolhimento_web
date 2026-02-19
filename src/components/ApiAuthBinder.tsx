import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { setApiAuthTokenGetter } from '@/api/client'

/**
 * Conecta o token da sessão Supabase ao cliente da API (Authorization: Bearer).
 * Deve ser renderizado dentro de AuthProvider.
 */
export function ApiAuthBinder() {
  const { getAccessToken, isConfigured } = useAuth()

  useEffect(() => {
    if (isConfigured) {
      setApiAuthTokenGetter(getAccessToken)
    }
    return () => setApiAuthTokenGetter(() => Promise.resolve(null))
  }, [getAccessToken, isConfigured])

  return null
}

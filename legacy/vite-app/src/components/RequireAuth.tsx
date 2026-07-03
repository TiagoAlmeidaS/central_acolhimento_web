import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Protege rotas: redireciona para /login se Supabase está configurado e o usuário não está autenticado.
 * Se Supabase não estiver configurado, renderiza os filhos (modo sem auth).
 */
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { session, loading, isConfigured } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-slate-500 dark:text-slate-400">Carregando...</div>
      </div>
    )
  }

  if (isConfigured && !session) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

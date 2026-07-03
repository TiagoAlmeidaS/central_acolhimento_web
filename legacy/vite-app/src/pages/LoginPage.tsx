import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const { signInWithPassword, signInWithGoogle, isConfigured } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isConfigured) {
      setError('Login não configurado (Supabase). Use modo desenvolvimento sem auth.')
      return
    }
    setLoading(true)
    const { error: err } = await signInWithPassword(email, password)
    setLoading(false)
    if (err) {
      setError(err.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : err.message)
      return
    }
    navigate(from, { replace: true })
  }

  const handleGoogle = async () => {
    setError(null)
    if (!isConfigured) {
      setError('Login não configurado (Supabase).')
      return
    }
    setLoading(true)
    const { error: err } = await signInWithGoogle()
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate(from, { replace: true })
  }

  if (!isConfigured) {
    return (
      <div className="bg-mesh min-h-screen flex flex-col items-center justify-center p-4 font-display text-slate-900 dark:text-slate-100 dark:bg-background-dark">
        <div className="w-full max-w-md text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para ativar o login.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-primary font-medium hover:underline"
          >
            Ir para o sistema
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-mesh min-h-screen flex flex-col items-center justify-center p-4 font-display text-slate-900 dark:text-slate-100 dark:bg-background-dark">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-primary text-4xl">castle</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Torre de Controle
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
            Sistema de Acolhimento
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-xl p-8 border border-slate-100 dark:border-slate-800">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="email">
                E-mail
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-xl">mail</span>
                </span>
                <input
                  className="block w-full pl-10 pr-3 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  id="email"
                  name="email"
                  placeholder="seu@email.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300" htmlFor="password">
                  Senha
                </label>
                <a className="text-sm font-medium text-primary hover:underline" href="#">
                  Esqueci minha senha
                </a>
              </div>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <span className="material-symbols-outlined text-xl">lock</span>
                </span>
                <input
                  className="block w-full pl-10 pr-12 py-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  id="password"
                  name="password"
                  placeholder="••••••••"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors">
                  <span className="material-symbols-outlined text-xl">visibility</span>
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                className="h-4 w-4 text-primary focus:ring-primary border-slate-300 rounded cursor-pointer"
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label className="ml-2 block text-sm text-slate-600 dark:text-slate-400 cursor-pointer" htmlFor="remember-me">
                Lembrar de mim
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all disabled:opacity-50"
            >
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-slate-900 text-slate-500">ou</span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleGoogle}
              disabled={loading}
              className="mt-4 w-full flex justify-center items-center gap-2 py-3 px-4 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Entrar com Google
            </button>
          </div>
        </div>

        <div className="mt-10 text-center space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            A serviço do Reino em Sapé
          </p>
          <div className="flex justify-center gap-4 text-slate-400 text-xs uppercase tracking-widest font-medium">
            <a className="hover:text-primary transition-colors" href="#">Suporte</a>
            <span>•</span>
            <a className="hover:text-primary transition-colors" href="#">Privacidade</a>
            <span>•</span>
            <a className="hover:text-primary transition-colors" href="#">Termos</a>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 w-full opacity-5 pointer-events-none select-none">
        <div className="h-48 w-full bg-gradient-to-t from-primary to-transparent" />
      </div>
    </div>
  )
}

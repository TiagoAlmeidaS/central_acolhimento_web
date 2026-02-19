import { Link } from 'react-router-dom'

export function LoginPage() {
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
          <form action="#" className="space-y-6">
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
                  required
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
                  required
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
              />
              <label className="ml-2 block text-sm text-slate-600 dark:text-slate-400 cursor-pointer" htmlFor="remember-me">
                Lembrar de mim
              </label>
            </div>

            <Link
              to="/"
              className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-sm text-base font-semibold text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all"
            >
              Entrar no Sistema
            </Link>
          </form>
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

import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { ApiAuthBinder } from '@/components/ApiAuthBinder'
import { RequireAuth } from '@/components/RequireAuth'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { CuidadoresPage } from '@/pages/CuidadoresPage'
import { RelatoriosPage } from '@/pages/RelatoriosPage'
import { ConfiguracoesPage } from '@/pages/ConfiguracoesPage'
import { ConvidadosPage } from '@/pages/ConvidadosPage'
import { DashboardMeuServicoPage } from '@/pages/mobile/DashboardMeuServicoPage'
import { MapaAcolhimentoPage } from '@/pages/mobile/MapaAcolhimentoPage'
import { MetabolismoAlmaPage } from '@/pages/mobile/MetabolismoAlmaPage'

function App() {
  return (
    <AuthProvider>
      <ApiAuthBinder />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        {/* Rotas protegidas (quando Supabase configurado) */}
        <Route path="/meu-servico" element={<RequireAuth><DashboardMeuServicoPage /></RequireAuth>} />
        <Route path="/meu-servico/acolhidos" element={<RequireAuth><DashboardMeuServicoPage /></RequireAuth>} />
        <Route path="/meu-servico/oracoes" element={<RequireAuth><DashboardMeuServicoPage /></RequireAuth>} />
        <Route path="/meu-servico/perfil" element={<RequireAuth><DashboardMeuServicoPage /></RequireAuth>} />
        <Route path="/mapa" element={<RequireAuth><MapaAcolhimentoPage /></RequireAuth>} />
        <Route path="/mapa/equipe" element={<RequireAuth><MapaAcolhimentoPage /></RequireAuth>} />
        <Route path="/mapa/mapa-view" element={<RequireAuth><MapaAcolhimentoPage /></RequireAuth>} />
        <Route path="/mapa/dados" element={<RequireAuth><MapaAcolhimentoPage /></RequireAuth>} />
        <Route path="/mapa/ajustes" element={<RequireAuth><MapaAcolhimentoPage /></RequireAuth>} />
        <Route path="/metabolismo" element={<RequireAuth><MetabolismoAlmaPage /></RequireAuth>} />
        {/* Desktop (coordenação) */}
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<DashboardPage />} />
          <Route path="cuidadores" element={<CuidadoresPage />} />
          <Route path="convidados" element={<ConvidadosPage />} />
          <Route path="relatorios" element={<RelatoriosPage />} />
          <Route path="configuracoes" element={<ConfiguracoesPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}

export default App

import { Routes, Route, Navigate } from 'react-router-dom'
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
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      {/* Mobile-first (app irmão/cuidador) */}
      <Route path="/meu-servico" element={<DashboardMeuServicoPage />} />
      <Route path="/meu-servico/acolhidos" element={<DashboardMeuServicoPage />} />
      <Route path="/meu-servico/oracoes" element={<DashboardMeuServicoPage />} />
      <Route path="/meu-servico/perfil" element={<DashboardMeuServicoPage />} />
      <Route path="/mapa" element={<MapaAcolhimentoPage />} />
      <Route path="/mapa/equipe" element={<MapaAcolhimentoPage />} />
      <Route path="/mapa/mapa-view" element={<MapaAcolhimentoPage />} />
      <Route path="/mapa/dados" element={<MapaAcolhimentoPage />} />
      <Route path="/mapa/ajustes" element={<MapaAcolhimentoPage />} />
      <Route path="/metabolismo" element={<MetabolismoAlmaPage />} />
      {/* Desktop (coordenação) */}
      <Route path="/" element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="cuidadores" element={<CuidadoresPage />} />
        <Route path="convidados" element={<ConvidadosPage />} />
        <Route path="relatorios" element={<RelatoriosPage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App

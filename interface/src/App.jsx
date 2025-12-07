import { Routes, Route, Navigate } from "react-router-dom"; // Adicione Navigate aqui se precisar redirecionar o root
import MainLayout from "./layouts/Mainlayout";
import FullScreenLayout from "./layouts/FullScreenLayout";
import HomePage from "@/pages/HomePage";
import ProdutosPage from "@/pages/ProdutosPage";
import PdvsPage from "@/pages/PdvsPage";
import PontoVendaPage from "@/pages/PontoVendaPage";
import FiscalPage from "./pages/FiscalPage";
import CrediarioPage from "./pages/CrediarioPage";
import LoginPage from "./pages/LoginPage";

import { Toaster } from "sonner";
import { WebSocketProvider } from "./WebSocketContext";

// Configurações
import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import GeralSettingsPage from "./pages/configuracoes/ConfigGeraisPage";
import OperacionalSettingsPage from "./pages/configuracoes/operacional";
import PerfilSettingsPage from "./pages/configuracoes/perfils";
import FinanceiroSettingsPage from "./pages/configuracoes/financeiro";
import FiscalSettingsPage from "./pages/configuracoes/fiscal";
import ConexoesSettingsPage from "./pages/configuracoes/conexoes";
import { SettingsProvider } from "./ConfigContext";

// IMPORTANTE: Importe o componente que criamos
import PrivateRoute from "./components/rotasprivadas";

function App() {
  return (
    <SettingsProvider>
      <WebSocketProvider>
        <div>
          <Routes>
            
            {/* --- ROTAS PÚBLICAS (Acesso liberado) --- */}
            {/* O Login usa FullScreenLayout mas fica fora da proteção */}
            <Route element={<FullScreenLayout />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* --- ROTAS PROTEGIDAS (Só acessa com Token) --- */}
            <Route element={<PrivateRoute />}>
              
              {/* Layout Principal com Sidebar */}
              <Route element={<MainLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/produtos" element={<ProdutosPage />} />
                <Route path="/pdvs" element={<PdvsPage />} />
                <Route path="/fiscal" element={<FiscalPage />} />
                <Route path="/crediario" element={<CrediarioPage />} />
              </Route>

              {/* Layout FullScreen Protegido (PDV) */}
              <Route element={<FullScreenLayout />}>
                <Route path="/pontovenda" element={<PontoVendaPage />} />
              </Route>

              {/* Rotas de Configuração */}
              <Route path="/configuracoes" element={<ConfiguracoesPage />}>
                <Route index element={<GeralSettingsPage />} /> 
                <Route path="geral" element={<GeralSettingsPage />} />
                <Route path="operacional" element={<OperacionalSettingsPage />} />
                <Route path="perfil" element={<PerfilSettingsPage />} />
                <Route path="financeiro" element={<FinanceiroSettingsPage />} />
                <Route path="fiscal" element={<FiscalSettingsPage />} />
                <Route path="conexoes" element={<ConexoesSettingsPage />} />
              </Route>

            </Route>
            {/* Fim das Rotas Protegidas */}

          </Routes>
          <Toaster richColors position="top-center" />  
        </div>
      </WebSocketProvider>
    </SettingsProvider>
  );
}

export default App;
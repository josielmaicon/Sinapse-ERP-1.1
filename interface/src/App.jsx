import { Routes, Route } from "react-router-dom";
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

import ConfiguracoesPage from "./pages/ConfiguracoesPage";
import GeralSettingsPage from "./pages/configuracoes/ConfigGeraisPage";
import OperacionalSettingsPage from "./pages/configuracoes/operacional";
import PerfilSettingsPage from "./pages/configuracoes/perfils";
import FinanceiroSettingsPage from "./pages/configuracoes/financeiro";
import FiscalSettingsPage from "./pages/configuracoes/fiscal";
import ConexoesSettingsPage from "./pages/configuracoes/conexoes";
import { SettingsProvider } from "./ConfigContext";

function App() {
  return (
  <SettingsProvider>
    <WebSocketProvider>
      <div>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/produtos" element={<ProdutosPage />} />
            <Route path="/pdvs" element={<PdvsPage />} />
            <Route path="/fiscal" element={<FiscalPage />} />
            <Route path="/crediario" element={<CrediarioPage />} />
          </Route>

          <Route element={<FullScreenLayout />}>
            <Route path="/pontovenda" element={<PontoVendaPage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route path="/configuracoes" element={<ConfiguracoesPage />}>
            <Route index element={<GeralSettingsPage />} /> 
            <Route path="geral" element={<GeralSettingsPage />} />
            <Route path="operacional" element={<OperacionalSettingsPage />} />
            <Route path="perfil" element={<PerfilSettingsPage />} />
            <Route path="financeiro" element={<FinanceiroSettingsPage />} />
            <Route path="fiscal" element={<FiscalSettingsPage />} />
            <Route path="conexoes" element={<ConexoesSettingsPage />} />
        </Route>
        </Routes>
        <Toaster richColors position="top-center" />  
      </div>
    </WebSocketProvider>
  </SettingsProvider>
  );
}

export default App;
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

function App() {
  return (
  <WebSocketProvider>
    <div>
      <Routes>
        {/* Grupo de rotas que usam o LAYOUT PRINCIPAL (com TopBar) */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/produtos" element={<ProdutosPage />} />
          <Route path="/pdvs" element={<PdvsPage />} />
          <Route path="/fiscal" element={<FiscalPage />} />
          <Route path="/crediario" element={<CrediarioPage />} />
        </Route>

        {/* Grupo de rotas que usam o LAYOUT DE TELA CHEIA (sem TopBar) */}
        <Route element={<FullScreenLayout />}>
          <Route path="/pontovenda" element={<PontoVendaPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Route>
        <Route path="/configuracoes" element={<ConfiguracoesPage />}>
          <Route index element={<GeralSettingsPage />} /> 
          <Route path="geral" element={<GeralSettingsPage />} />
          {/* <Route path="operacional" element={<OperacionalSettingsPage />} />
          <Route path="perfil" element={<PerfilSettingsPage />} />
          <Route path="financeiro" element={<FinanceiroSettingsPage />} />
          <Route path="fiscal" element={<FiscalSettingsPage />} />
          <Route path="conexoes" element={<ConexoesSettingsPage />} />
          */}
      </Route>
      </Routes>
      <Toaster richColors position="top-center" />  
    </div>
  </WebSocketProvider>
  );
}

export default App;
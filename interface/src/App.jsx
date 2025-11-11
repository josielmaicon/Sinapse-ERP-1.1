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

// ✅ 1. Importar o "Abraço"
import { WebSocketProvider } from "./WebSocketContext";

function App() {
  return (
  // ✅ 2. "Abraçar" toda a aplicação
  // (Nota: Em um app real, o Provider viria *depois* do login,
  // mas para um canal global, colocamos aqui)
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
      </Routes>
      <Toaster richColors position="top-center" />  
    </div>
  </WebSocketProvider>
  );
}

export default App;
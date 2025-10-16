// src/App.jsx

import { Routes, Route } from "react-router-dom";

// 1. Importe seus novos layouts
import MainLayout from "./layouts/Mainlayout";
import FullScreenLayout from "./layouts/FullScreenLayout";

// 2. Importe suas páginas diretamente aqui
import HomePage from "@/pages/HomePage";
import ProdutosPage from "@/pages/ProdutosPage";
import PdvsPage from "@/pages/PdvsPage";
import PontoVendaPage from "@/pages/PontoVendaPage";

function App() {
  return (
    <Routes>
      {/* Grupo de rotas que usam o LAYOUT PRINCIPAL (com TopBar) */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/produtos" element={<ProdutosPage />} />
        <Route path="/pdvs" element={<PdvsPage />} />
      </Route>

      {/* Grupo de rotas que usam o LAYOUT DE TELA CHEIA (sem TopBar) */}
      <Route element={<FullScreenLayout />}>
        <Route path="/pontovenda" element={<PontoVendaPage />} />
      </Route>
    </Routes>
  );
}

export default App;
// 1. Importe os componentes das suas páginas
import HomePage from "@/pages/HomePage";
import ProdutosPage from "@/pages/ProdutosPage";
import PdvsPage from "@/pages/PdvsPage";
import PontoVendaPage from "@/pages/PontoVendaPage";
import FiscalPage from "./pages/FiscalPage";
import CrediarioPage from "./pages/CrediarioPage";
import LoginPage from "./pages/LoginPage";

const routes = [
  // 2. Substitua a string pelo componente importado
  { path: '/', name: 'Início', component: <HomePage />, showInNav: true },
  // { path: '/estoque', name: 'Estoque', component: <EstoquePage />, icon: Boxes, showInNav: true },
  { path: '/produtos', name: 'Produtos', component: <ProdutosPage />,showInNav: true },
  { path: '/pdvs', name: 'PDVs', component: <PdvsPage />, showInNav: true },
  { path: '/fiscal', name: 'Fiscal', component: <FiscalPage />, showInNav: true },
  { path: '/crediario', name: 'Crediário', component: <CrediarioPage />, showInNav: true },
  { path: '/pontovenda', name: 'Ponto de Venda', component: <PontoVendaPage />, showInNav: false },
  { path: '/login', name: 'Login', component: <LoginPage />, showInNav: false },
];

export default routes;
// 1. Importe os componentes das suas páginas
import HomePage from "@/pages/HomePage";
import EstoquePage from "@/pages/EstoquePage";
import ProdutosPage from "@/pages/ProdutosPage";
import PdvsPage from "@/pages/PdvsPage";
import PontoVendaPage from "@/pages/PontoVendaPage";
import FiscalPage from "./pages/FiscalPage";

const routes = [
  // 2. Substitua a string pelo componente importado
  { path: '/', name: 'Início', component: <HomePage />, showInNav: true },
  // { path: '/estoque', name: 'Estoque', component: <EstoquePage />, icon: Boxes, showInNav: true },
  { path: '/produtos', name: 'Produtos', component: <ProdutosPage />,showInNav: true },
  { path: '/pdvs', name: 'PDVs', component: <PdvsPage />, showInNav: true },
  { path: '/fiscal', name: 'Fiscal', component: <FiscalPage />, showInNav: true },
  { path: '/pdvs', name: 'Fornecedores', component: <PdvsPage />, showInNav: true },
  { path: '/pdvs', name: 'Crediário', component: <PdvsPage />, showInNav: true },
  { path: '/pontovenda', name: 'Ponto de Venda', component: <PontoVendaPage />, showInNav: false },
];

export default routes;
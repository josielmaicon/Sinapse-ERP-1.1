import { Boxes, Home, Package, ShoppingCart } from "lucide-react";

// 1. Importe os componentes das suas páginas
import HomePage from "@/pages/HomePage";
import EstoquePage from "@/pages/EstoquePage";
import ProdutosPage from "@/pages/ProdutosPage";
import PdvsPage from "@/pages/PdvsPage";
import PontoVendaPage from "@/pages/PontoVendaPage";

const routes = [
  // 2. Substitua a string pelo componente importado
  { path: '/', name: 'Início', component: <HomePage />, icon: Home, showInNav: true },
  // { path: '/estoque', name: 'Estoque', component: <EstoquePage />, icon: Boxes, showInNav: true },
  { path: '/produtos', name: 'Produtos', component: <ProdutosPage />, icon: Package, showInNav: true },
  { path: '/pdvs', name: 'PDVs', component: <PdvsPage />, icon: ShoppingCart, showInNav: true },
  { path: '/pontovenda', name: 'Ponto de Venda', component: <PontoVendaPage />, icon: Package, showInNav: false },
];

export default routes;
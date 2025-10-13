import HomePageLayout from "@/layouts/HomepageLayout"
import PdvRevenueChart from "@/components/PdvChart"
import StatCard from "@/components/statCard"
import { AlertTriangle, ArchiveX, PackageSearch } from "lucide-react"
import TopProductsChart from "@/components/ProdMaisVendidos"
import PdvStatusTable from "@/components/TabelaPDVsResumida"

import { columns } from "@/components/Colunas";
import { ProductDataTable } from "@/components/TabelaProdutos";

// 🧩 MOCK: Dados simulados para os produtos
const productData = [
  { id: "PROD-001", name: "Leite Integral 1L", category: "Laticínios", quantity: 150, daysUntilExpiry: 15 },
  { id: "PROD-002", name: "Pão Francês", category: "Padaria", quantity: 80, daysUntilExpiry: 1 },
  { id: "PROD-003", name: "Coca-Cola 2L", category: "Bebidas", quantity: 200, daysUntilExpiry: 90 },
  { id: "PROD-004", name: "Detergente Ypê", category: "Limpeza", quantity: 95, daysUntilExpiry: 365 },
  { id: "PROD-005", name: "Iogurte Natural", category: "Laticínios", quantity: 40, daysUntilExpiry: 5 },
  { id: "PROD-006", name: "Tomate Kg", category: "Hortifruti", quantity: 25, daysUntilExpiry: -2 }, // Vencido
  // ... adicione mais 10-15 produtos para testar a paginação
];


export default function HomePage() {
  const stockAlerts = {
    expiringSoon: 48,
    expired: 5,
    lowStock: 12,
  }

  return (
    <HomePageLayout
      // ✅ Substitua o componente aqui
      TopRight={<PdvRevenueChart/>}
      BottomLeft={
        <div className="grid grid-cols-3 gap-2 h-full">
          <StatCard
            title="Próximos do Vencimento"
            value={stockAlerts.expiringSoon}
            description="Itens vencendo nos próximos 7 dias"
            icon={AlertTriangle}
          />
          <StatCard
            title="Vencidos"
            value={stockAlerts.expired}
            description="Itens a serem retirados"
            icon={ArchiveX}
          />
          <StatCard
            title="Estoque Baixo"
            value={stockAlerts.lowStock}
            description="Abaixo do nível mínimo"
            icon={PackageSearch}
          />
        </div>      }
      SideTop={<PdvStatusTable />}
      SideBottom={<TopProductsChart />}
    />
  )
}
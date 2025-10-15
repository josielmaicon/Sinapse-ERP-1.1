import HomePageLayout from "@/layouts/HomepageLayout"
import PdvRevenueChart from "@/components/PdvChart"
import StatCard from "@/components/statCard"
import { AlertTriangle, ArchiveX, PackageSearch } from "lucide-react"
import TopProductsChart from "@/components/ProdMaisVendidos"
import PdvStatusTable from "@/components/TabelaPDVsResumida"

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
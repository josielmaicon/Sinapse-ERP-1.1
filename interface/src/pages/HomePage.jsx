// src/pages/HomePage.jsx

"use client"

import * as React from "react"
import HomePageLayout from "@/layouts/HomepageLayout"
import PdvRevenueChart from "@/components/homepage/PdvChart"
import StatCard from "@/components/statCard"
import { AlertTriangle, ArchiveX, PackageSearch } from "lucide-react"
import TopProductsChart from "@/components/homepage/ProdMaisVendidos"
import PdvStatusTable from "@/components/homepage/TabelaPDVsResumida"

export default function HomePage() {
  const [stockAlerts, setStockAlerts] = React.useState({
    expiringSoon: 0,
    expired: 0,
    lowStock: 0,
  });
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStockAlerts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:8000/api/produtos/dashboard-stats/");
        if (!response.ok) throw new Error("Falha ao buscar alertas de estoque");
        const data = await response.json();
        setStockAlerts({
          expiringSoon: data.expiring_soon_count,
          expired: data.expired_count,
          lowStock: data.low_stock_count,
        });
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStockAlerts();
  }, []);

  return (
    <HomePageLayout
      TopRight={<PdvRevenueChart />}
      BottomLeft={
        <div className="grid grid-cols-3 gap-2 h-full">
          {/* ✅ 3. USO SIMPLIFICADO: Passando a prop 'isLoading' */}
          <StatCard
            title="Próximos do Vencimento"
            value={stockAlerts.expiringSoon}
            description="Itens vencendo nos próximos 7 dias"
            icon={AlertTriangle}
            isLoading={isLoading}
          />
          <StatCard
            title="Vencidos"
            value={stockAlerts.expired}
            description="Itens a serem retirados"
            icon={ArchiveX}
            isLoading={isLoading}
          />
          <StatCard
            title="Estoque Baixo"
            value={stockAlerts.lowStock}
            description="Abaixo do nível mínimo"
            icon={PackageSearch}
            isLoading={isLoading}
          />
        </div>
      }
      SideTop={<PdvStatusTable />}
      SideBottom={<TopProductsChart />}
    />
  )
}
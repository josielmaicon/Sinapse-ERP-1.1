"use client"

import * as React from "react"
import PdvsPageLayout from "@/layouts/PdvsPageLayout"
import HourlyRevenueChart from "@/components/FatpHora"
import PdvHistoryLog from "@/components/MovHistpPdv"
import { PdvDataTable } from "@/components/TabelaPDVs"
import TicketMedioCard from "@/components/TicketMedioCardI"
import HorasTrabalhadasCard from "@/components/HorasTrabalhadasCardsI"
import FaturamentoTotalCard from "@/components/FaturamentoTotalCard"
import TicketMedioCardGeral from "@/components/TicketMedioCard"
import PdvsOperandoCard from "@/components/PDVAbertos"
import PdvAlertPanel from "@/components/PainelAlertaPDV";

export default function PdvsPage() {
  const [dashboardStats, setDashboardStats] = React.useState({
    faturamento_total: 0,
    ticket_medio: 0,
    pdvs_operando: 0,
    pdvs_totais: 0,
  });
  const [pdvsData, setPdvsData] = React.useState([]);
  const [selectedPdv, setSelectedPdv] = React.useState(null);
  const [mainView, setMainView] = React.useState('grafico');

  const [operatorData, setOperatorData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchData = async () => {
      setIsLoading(true);
      try {
        // Usamos Promise.all para buscar tudo em paralelo
        const [summaryRes, pdvsRes, operatorsRes] = await Promise.all([
          fetch('http://localhost:8000/api/pdvs/summary'),
          fetch('http://localhost:8000/api/pdvs/'),
          fetch('http://localhost:8000/api/usuarios/performance')
        ]);

        if (!summaryRes.ok) throw new Error('Falha ao buscar resumo');
        if (!pdvsRes.ok) throw new Error('Falha ao buscar PDVs');
        if (!operatorsRes.ok) throw new Error('Falha ao buscar operadores');

        const summaryData = await summaryRes.json();
        const pdvsListData = await pdvsRes.json();
        const operatorsPerformanceData = await operatorsRes.json();

        setDashboardStats(summaryData);
        setPdvsData(pdvsListData);
        setOperatorData(operatorsPerformanceData);

        if (pdvsListData.length > 0) {
          handlePdvSelect(pdvsListData[0]);
        }
        
      } catch (error) {
        console.error("Falha ao buscar dados da página de PDVs:", error);
      } finally {
        setIsLoading(false);
      }
    };

    React.useEffect(() => {
      fetchData();
    }, []);
  React.useEffect(() => {
    fetchData();
  }, []);

  const handlePdvSelect = (pdv) => {
    setSelectedPdv(pdv);
    // ✅ Lógica de Alerta (precisará de um endpoint /api/solicitacoes)
    // if (pdv?.pendingAlert) {
    //   setMainView('alerta');
    // } else {
    //   setMainView('grafico');
    // }
  };

  const handleResolveAlert = (resolution) => { /* ... */ };

  return (
    <PdvsPageLayout
      StatCard1={<FaturamentoTotalCard value={dashboardStats.faturamento_total} />}
      StatCard2={<TicketMedioCardGeral value={dashboardStats.ticket_medio} />}
      StatCard3={
        <PdvsOperandoCard 
          operando={dashboardStats.pdvs_operando} 
          total={dashboardStats.pdvs_totais} 
        />
      }
      
      ListaPDVs={
        <PdvDataTable 
          data={pdvsData} 
          operatorData={operatorData}
          onPdvSelect={handlePdvSelect}
        />
      }

      HoldPrincipal={
        mainView === 'alerta'
          ? <PdvAlertPanel alert={null} onResolve={handleResolveAlert} />
          : <HourlyRevenueChart pdv={selectedPdv} />
      }
      HistoricoVendas={<PdvHistoryLog pdv={selectedPdv} />}
      StatCardInterno1={<TicketMedioCard pdv={selectedPdv} />}
      StatCardInterno2={<HorasTrabalhadasCard pdv={selectedPdv} />}
    />
  );
}
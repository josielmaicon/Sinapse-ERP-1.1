"use client"

import * as React from "react"
import PdvsPageLayout from "@/layouts/PdvsPageLayout"
import HourlyRevenueChart from "@/components/pdvs/FatpHora"
import PdvHistoryLog from "@/components/pdvs/MovHistpPdv"
import { PdvDataTable } from "@/components/pdvs/TabelaPDVs"
import TicketMedioCard from "@/components/pdvs/TicketMedioCardI"
import HorasTrabalhadasCard from "@/components/pdvs/HorasTrabalhadasCardsI"
import FaturamentoTotalCard from "@/components/pdvs/FaturamentoTotalCard"
import TicketMedioCardGeral from "@/components/pdvs/TicketMedioCard"
import PdvsOperandoCard from "@/components/pdvs/PDVAbertos"
import PdvAlertPanel from "@/components/pdvs/PainelAlertaPDV";

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
  const [pdvStats, setPdvStats] = React.useState({ ticket_medio: 0, inicio_turno: null });

  const fetchData = async () => {
      setIsLoading(true);
      try {
        const [summaryRes, pdvsRes, operatorsRes] = await Promise.all([
          fetch('http://localhost:8000/pdvs/summary'),
          fetch('http://localhost:8000/pdvs/'),
          fetch('http://localhost:8000/usuarios/performance')
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
    if (!selectedPdv) return;

    const fetchPdvStats = async () => {
      try {
        const res = await fetch(`http://localhost:8000/pdvs/${selectedPdv.id}/stats`);
        const data = await res.json();
        setPdvStats(data);
      } catch (e) {
        console.error(e);
        setPdvStats({ ticket_medio: 0, inicio_turno: null });
      }
    };

    fetchPdvStats();
  }, [selectedPdv]);

  const handlePdvSelect = (pdv) => {
    setSelectedPdv(pdv);
    // ✅ Lógica de Alerta (precisará de um endpoint /solicitacoes)
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
          refetchData={fetchData}
          selectedPdv={selectedPdv}
        />
      }

      HoldPrincipal={
        mainView === 'alerta'
          ? <PdvAlertPanel alert={null} onResolve={handleResolveAlert} />
          : <HourlyRevenueChart pdv={selectedPdv} />
      }
      HistoricoVendas={<PdvHistoryLog pdv={selectedPdv} />}
      StatCardInterno1={<TicketMedioCard value={pdvStats.ticket_medio} />}
      StatCardInterno2={<HorasTrabalhadasCard openTime={pdvStats.inicio_turno} />}
    />
  );
}
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
import { toast } from "sonner"
import { useWebSocket } from "@/WebSocketContext"

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

  const [activeAlerts, setActiveAlerts] = React.useState([]);
  const { lastMessage, isConnected } = useWebSocket();

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
    // Se a última mensagem for uma nova solicitação...
    if (lastMessage && lastMessage.type === "NOVA_SOLICITACAO") {
      
      // Adiciona a nova solicitação (payload) ao nosso estado local 'activeAlerts'
      // (Evita duplicatas se a mensagem chegar várias vezes)
      setActiveAlerts(prevAlerts => {
          const alreadyExists = prevAlerts.some(alert => alert.id === lastMessage.payload.id);
          if (!alreadyExists) {
              console.log("ALERTA RECEBIDO:", lastMessage.payload);
              toast.warning(`Nova Solicitação do PDV: ${lastMessage.payload.pdv_nome}`, {
                  description: `Operador ${lastMessage.payload.operador_nome} pede: ${lastMessage.payload.tipo}`,
                  duration: 10000,
              });
              return [lastMessage.payload, ...prevAlerts]; // Adiciona no topo
          }
          return prevAlerts; // Sem mudanças
      });
      
      // Se a tela principal estiver em 'grafico', força a mudança para 'alerta'
      if (mainView !== 'alerta') {
         setMainView('alerta');
      }
    }
    
    // Se a última mensagem for uma *conclusão* (aprovada/rejeitada)
    if (lastMessage && lastMessage.type === "SOLICITACAO_CONCLUIDA") {
        // Remove o alerta da nossa lista local (pois já foi resolvido, talvez por outro gerente)
        setActiveAlerts(prevAlerts => 
            prevAlerts.filter(alert => alert.id !== lastMessage.payload.id)
        );
        // Se este era o último alerta, volta para o gráfico
        if (activeAlerts.length === 1 && mainView === 'alerta') {
            setMainView('grafico');
        }
    }

  }, [lastMessage]);

  const handleResolveAlert = async (solicitacao, acao) => { // 'acao' será 'aprovado' ou 'rejeitado'
    if (!solicitacao) return;

    console.log(`Gerente resolvendo solicitação ID ${solicitacao.id} como: ${acao}`);
    
    try {
        // (Aqui precisaríamos do ID do admin que aprovou, mas por enquanto,
        // vamos assumir que o backend aceita a aprovação)
        
        // Chama a API que o backend (solicitacoes.py) já tem
        const response = await fetch(`http://localhost:8000/solicitacoes/${solicitacao.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                status: acao,
                autorizado_por_id: 1 // TODO: Passar o ID real do admin logado
            })
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.detail || "Falha ao resolver solicitação");
        }

        // A API foi sucesso. O backend vai disparar um socket 'SOLICITACAO_CONCLUIDA'.
        // O useEffect [lastMessage] vai pegar esse sinal e remover o alerta da lista.
        toast.success(`Solicitação #${solicitacao.id} foi marcada como '${acao}'.`);
        
        // Remove localmente (mais rápido que esperar o socket)
        setActiveAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== solicitacao.id));
        
        // Se não houver mais alertas, volta pro gráfico
        if (activeAlerts.length <= 1) {
            setMainView('grafico');
        }
        
    } catch (error) {
        toast.error("Erro ao Resolver", { description: error.message });
    }
  };

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
    const alertaPendenteParaEstePDV = activeAlerts.find(a => a.pdv_id === pdv?.id);
    
    if (alertaPendenteParaEstePDV) {
        setMainView('alerta');
    } else {
        setMainView('grafico');
    }
  };

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
        mainView === 'alerta' && activeAlerts.length > 0
          ? <PdvAlertPanel alert={activeAlerts[0]} onResolve={handleResolveAlert} />
          : <HourlyRevenueChart pdv={selectedPdv} />
      }
      HistoricoVendas={<PdvHistoryLog pdv={selectedPdv} />}
      StatCardInterno1={<TicketMedioCard value={pdvStats.ticket_medio} />}
      StatCardInterno2={<HorasTrabalhadasCard openTime={pdvStats.inicio_turno} />}
    />
  );
}
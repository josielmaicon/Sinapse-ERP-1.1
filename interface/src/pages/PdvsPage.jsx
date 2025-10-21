"use client"

import * as React from "react"
import PdvsPageLayout from "@/layouts/PdvsPageLayout"

// Importe todos os seus componentes de conteúdo
import HourlyRevenueChart from "@/components/FatpHora"
import PdvHistoryLog from "@/components/MovHistpPdv"
import { PdvDataTable } from "@/components/TabelaPDVs"
import TicketMedioCard from "@/components/TicketMedioCardI"
import HorasTrabalhadasCard from "@/components/HorasTrabalhadasCardsI"
import FaturamentoTotalCard from "@/components/FaturamentoTotalCard"
import TicketMedioCardGeral from "@/components/TicketMedioCard"
import PdvsOperandoCard from "@/components/PDVAbertos"

import PdvAlertPanel from "@/components/PainelAlertaPDV"; // ✅ 1. Importe o novo painel de alerta

// 🧩 MOCK: Dados atualizados com a informação de alerta
const pdvsData = [
  { id: "PDV-01", name: "Caixa 01", operator: "Ana Paula", inRegister: 2150.70, status: "aberto", numberOfSales: 41, openTime: new Date("2025-10-15T08:02:00"), 
    pendingAlert: { type: 'cancel_item', operator: 'Ana Paula', item: 'Coca-Cola 2L', value: 9.50 } 
  },
  { id: "PDV-02", name: "Caixa 02", operator: "Carlos Souza", inRegister: 1840.25, status: "aberto", numberOfSales: 38, openTime: new Date("2025-10-15T08:05:00"),
    pendingAlert: null 
  },
  { id: "PDV-03", name: "Caixa 03", operator: "Mariana Lima", inRegister: 0, status: "fechado", numberOfSales: 0, openTime: null,
    pendingAlert: null 
  },
];

const operatorData = [ /* ... */ ];

export default function PdvsPage() {
  const [selectedPdv, setSelectedPdv] = React.useState(pdvsData[0]);
  // ✅ 2. NOVO ESTADO: Controla o que é exibido no painel principal
  const [mainView, setMainView] = React.useState('grafico'); // 'grafico' ou 'alerta'

  // ✅ 3. LÓGICA DE ATUALIZAÇÃO
  // Quando um novo PDV é selecionado, verificamos se ele tem um alerta
  const handlePdvSelect = (pdv) => {
    setSelectedPdv(pdv);
    if (pdv?.pendingAlert) {
      setMainView('alerta');
    } else {
      setMainView('grafico');
    }
  };

  const handleResolveAlert = (resolution) => {
    alert(`Alerta resolvido com status: ${resolution}.`);
    // Aqui você faria a chamada de API para resolver o alerta
    // e então voltaria para a visão do gráfico.
    setMainView('grafico');
  };

  return (
    <PdvsPageLayout
      StatCard1={<FaturamentoTotalCard pdvs={pdvsData} />}
      StatCard2={<TicketMedioCardGeral pdvs={pdvsData} />}
      StatCard3={<PdvsOperandoCard pdvs={pdvsData} />}
      
      ListaPDVs={
        <PdvDataTable 
          data={pdvsData} 
          operatorData={operatorData}
          onPdvSelect={handlePdvSelect} // Usa a nova função
        />
      }
      
      // ✅ 4. RENDERIZAÇÃO CONDICIONAL
      // O conteúdo do HoldPrincipal agora depende do estado 'mainView'
      HoldPrincipal={
        mainView === 'alerta'
          ? <PdvAlertPanel alert={selectedPdv?.pendingAlert} onResolve={handleResolveAlert} />
          : <HourlyRevenueChart pdv={selectedPdv} />
      }

      HistoricoVendas={<PdvHistoryLog pdv={selectedPdv} />}
      StatCardInterno1={<TicketMedioCard pdv={selectedPdv} />}
      StatCardInterno2={<HorasTrabalhadasCard pdv={selectedPdv} />}
    />
  );
}
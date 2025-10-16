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

// 🧩 MOCK: Fonte de dados central para a página inteira
const pdvsData = [
  { id: "PDV-01", name: "Caixa 01", operator: "Ana Paula", inRegister: 2150.70, status: "aberto", numberOfSales: 41, openTime: new Date("2025-10-15T08:02:00") },
  { id: "PDV-02", name: "Caixa 02", operator: "Carlos Souza", inRegister: 1840.25, status: "aberto", numberOfSales: 38, openTime: new Date("2025-10-15T08:05:00") },
  { id: "PDV-03", name: "Caixa 03", operator: "Mariana Lima", inRegister: 0, status: "fechado", numberOfSales: 0, openTime: null },
];

const operatorData = [
    { id: "OP-1", name: "Ana Paula", hoursToday: "6h 15m", ticketMedio: 52.45, status: "ativo" },
    { id: "OP-2", name: "Carlos Souza", hoursToday: "5h 45m", ticketMedio: 48.90, status: "ativo" },
    { id: "OP-3", name: "Mariana Lima", hoursToday: "0h 0m", ticketMedio: 0, status: "inativo" },
];

export default function PdvsPage() {
  const [selectedPdv, setSelectedPdv] = React.useState(pdvsData[0]);

  return (
    <PdvsPageLayout
      StatCard1={<FaturamentoTotalCard pdvs={pdvsData} />}
      StatCard2={<TicketMedioCardGeral pdvs={pdvsData} />}
      StatCard3={<PdvsOperandoCard pdvs={pdvsData} />}
      
      ListaPDVs={
        <PdvDataTable 
          data={pdvsData} 
          operatorData={operatorData}
          onPdvSelect={setSelectedPdv} 
        />
      }
      
      HoldPrincipal={<HourlyRevenueChart pdv={selectedPdv} />}
      HistoricoVendas={<PdvHistoryLog pdv={selectedPdv} />}
      StatCardInterno1={<TicketMedioCard pdv={selectedPdv} />}
      StatCardInterno2={<HorasTrabalhadasCard pdv={selectedPdv} />}
    />
  );
}
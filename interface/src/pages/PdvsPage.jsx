import PdvsPageLayout from "@/layouts/PdvsPageLayout"
import HourlyRevenueChart from "@/components/FatpHora";
import PdvHistoryLog from "@/components/MovHistpPdv";
import PdvDataTable from "@/components/TabelaPDVs";
import TicketMedioCard from "@/components/TicketMedioCardI";
import HorasTrabalhadasCard from "@/components/HorasTrabalhadasCardsI";

import FaturamentoTotalCard from "@/components/FaturamentoTotalCard";
import TicketMedioCardGeral from "@/components/TicketMedioCardI";
import PdvsOperandoCard from "@/components/PDVAbertos";

import React from "react";

const pdvsData = [
  { id: "PDV-01", name: "Caixa 01", operator: "Ana Paula", inRegister: 2150.70, status: "aberto", numberOfSales: 41, openTime: new Date("2025-10-15T08:02:00") },
  { id: "PDV-02", name: "Caixa 02", operator: "Carlos Souza", inRegister: 1840.25, status: "aberto", numberOfSales: 38, openTime: new Date("2025-10-15T08:05:00") },
  { id: "PDV-03", name: "Caixa 03", operator: "Mariana Lima", inRegister: 0, status: "fechado", numberOfSales: 0, openTime: null },
];

export default function PdvsPage() {
  // ✅ 1. O "CÉREBRO": A página agora guarda o estado do PDV selecionado
  const [selectedPdv, setSelectedPdv] = React.useState(pdvsData[0]);

  return (
    <PdvsPageLayout
      // --- StatCards Globais ---
      // Eles recebem a lista COMPLETA de PDVs para fazer seus cálculos
      StatCard1={<FaturamentoTotalCard pdvs={pdvsData} />}
      StatCard2={<TicketMedioCardGeral pdvs={pdvsData} />}
      StatCard3={<PdvsOperandoCard pdvs={pdvsData} />}

      // --- Lista Principal ---
      // A tabela recebe a lista completa e uma FUNÇÃO para avisar a página quando a seleção mudar
      ListaPDVs={
        <PdvDataTable 
          data={pdvsData} 
          onPdvSelect={setSelectedPdv} 
        />
      }
      
      // --- Componentes Contextuais ---
      // Eles recebem apenas o OBJETO do PDV que está selecionado no momento
      HoldPrincipal={<HourlyRevenueChart pdv={selectedPdv} />}
      HistoricoVendas={<PdvHistoryLog pdv={selectedPdv} />}
      StatCardInterno1={<TicketMedioCard pdv={selectedPdv} />}
      StatCardInterno2={<HorasTrabalhadasCard pdv={selectedPdv} />}
    />
  );
}
// src/components/pdvs/TicketMedioCard.jsx
"use client"
import * as React from "react"
import StatCard from "@/components/statCard"
import { BarChart2 } from "lucide-react"

export default function TicketMedioCardGeral({ pdvs }) {
  const ticketMedio = React.useMemo(() => {
    if (!pdvs || pdvs.length === 0) return 0;

    const totalRevenue = pdvs.reduce((acc, pdv) => acc + pdv.inRegister, 0);
    const totalSalesCount = pdvs.reduce((acc, pdv) => acc + pdv.numberOfSales, 0);

    if (totalSalesCount === 0) return 0; // Evita divisão por zero

    return totalRevenue / totalSalesCount;
  }, [pdvs]);

  return (
    <StatCard
      title="Ticket Médio (Dia)"
      value={ticketMedio.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      icon={BarChart2}
    />
  );
}
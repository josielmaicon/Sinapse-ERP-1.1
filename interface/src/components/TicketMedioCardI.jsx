// src/components/pdvs/TicketMedioCard.jsx

"use client"

import * as React from "react"
import StatCard from "@/components/statCard"
import { BarChart2 } from "lucide-react"

export default function TicketMedioCard({ pdv }) {
  const ticketMedio = React.useMemo(() => {
    if (!pdv || !pdv.numberOfSales || pdv.numberOfSales === 0) {
      return "R$ 0,00";
    }
    
    const value = pdv.inRegister / pdv.numberOfSales;
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }, [pdv]);

  return (
    <StatCard
      title="Ticket Médio do PDV"
      value={ticketMedio}
      icon={BarChart2}
    />
  );
}
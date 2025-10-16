// src/components/pdvs/FaturamentoTotalCard.jsx
"use client"
import * as React from "react"
import StatCard from "@/components/statCard" // Reutilizando nosso componente base
import { DollarSign } from "lucide-react"

export default function FaturamentoTotalCard({ pdvs }) {
  const totalRevenue = React.useMemo(() => {
    if (!pdvs || pdvs.length === 0) return 0;
    // Soma o valor 'inRegister' de todos os PDVs
    return pdvs.reduce((acc, pdv) => acc + pdv.inRegister, 0);
  }, [pdvs]);

  return (
    <StatCard
      title="Faturamento Total (Dia)"
      value={totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      icon={DollarSign}
    />
  );
}
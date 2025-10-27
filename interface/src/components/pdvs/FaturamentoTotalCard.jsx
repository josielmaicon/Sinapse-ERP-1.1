// src/components/pdvs/FaturamentoTotalCard.jsx
"use client"
import StatCard from "@/components/statCard"
import { DollarSign } from "lucide-react"

// ✅ O componente agora é "burro": só recebe o valor pronto.
export default function FaturamentoTotalCard({ value }) {
  return (
    <StatCard
      title="Faturamento Total (Dia)"
      value={value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      icon={DollarSign}
    />
  );
}
// src/components/pdvs/TicketMedioCard.jsx
"use client"
import StatCard from "@/components/statCard"
import { BarChart2 } from "lucide-react"

// ✅ O componente agora é "burro": só recebe o valor pronto.
export default function TicketMedioCardGeral({ value }) {
  return (
    <StatCard
      title="Ticket Médio (Dia)"
      value={value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      icon={BarChart2}
    />
  );
}
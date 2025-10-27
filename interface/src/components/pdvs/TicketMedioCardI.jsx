// src/components/TicketMedioCardI.jsx
// (O nome do seu arquivo pode ser TicketMedioCard.jsx)

"use client"
import * as React from "react"
import StatCard from "@/components/statCard"
import { BarChart2 } from "lucide-react"

// ✅ O componente agora é "burro" e só recebe o valor já calculado
export default function TicketMedioCard({ value }) {
  return (
    <StatCard
      title="Ticket Médio do PDV"
      value={value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      icon={BarChart2}
    />
  );
}
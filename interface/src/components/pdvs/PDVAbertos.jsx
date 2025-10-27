// src/components/pdvs/PdvsOperandoCard.jsx
"use client"
import StatCard from "@/components/statCard"
import { Activity } from "lucide-react"

// ✅ O componente agora é "burro": só recebe os valores prontos.
export default function PdvsOperandoCard({ operando, total }) {
  return (
    <StatCard
      title="PDVs Operando"
      value={`${operando} / ${total}`}
      icon={Activity}
    />
  );
}
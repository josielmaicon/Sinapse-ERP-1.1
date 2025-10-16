// src/components/pdvs/PdvsOperandoCard.jsx
"use client"
import * as React from "react"
import StatCard from "@/components/statCard"
import { Activity } from "lucide-react"

export default function PdvsOperandoCard({ pdvs }) {
  const operatingStats = React.useMemo(() => {
    if (!pdvs || pdvs.length === 0) return "0 / 0";

    const operatingCount = pdvs.filter(pdv => pdv.status === 'aberto').length;
    const totalCount = pdvs.length;

    return `${operatingCount} / ${totalCount}`;
  }, [pdvs]);

  return (
    <StatCard
      title="PDVs Operando"
      value={operatingStats}
      icon={Activity}
    />
  );
}
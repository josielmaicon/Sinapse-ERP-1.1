// src/components/pdvs/HorasTrabalhadasCard.jsx

"use client"

import * as React from "react"
import { differenceInHours, differenceInMinutes } from "date-fns"
import StatCard from "@/components/statCard"
import { Timer } from "lucide-react"

export default function HorasTrabalhadasCard({ pdv }) {
  // A lógica de cálculo também vive aqui dentro
  const hoursWorked = React.useMemo(() => {
    if (!pdv || !pdv.openTime) {
      return "N/A";
    }

    const now = new Date();
    const hours = differenceInHours(now, new Date(pdv.openTime)); // Garante que openTime é um objeto Date
    const minutes = differenceInMinutes(now, new Date(pdv.openTime)) % 60;
    
    return `${hours}h ${minutes}m`;
  }, [pdv]);

  return (
    <StatCard
      title="Horas em Operação"
      value={hoursWorked}
      icon={Timer}
    />
  );
}
// src/components/HorasTrabalhadasCardsI.jsx

"use client"

import * as React from "react"
import { differenceInHours, differenceInMinutes } from "date-fns"
import StatCard from "@/components/statCard"
import { Timer } from "lucide-react"

// ✅ A prop mudou de 'pdv' para 'openTime' (a data de início)
export default function HorasTrabalhadasCard({ openTime }) {
  const [now, setNow] = React.useState(new Date());

  // Efeito para atualizar o 'agora' a cada segundo, fazendo o relógio "ticar"
  React.useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hoursWorked = React.useMemo(() => {
    if (!openTime) {
      return "0h 0m"; // Se o caixa não foi aberto, mostra 0
    }

    const startTime = new Date(openTime);
    const hours = differenceInHours(now, startTime);
    const minutes = differenceInMinutes(now, startTime) % 60;
    
    return `${hours}h ${minutes}m`;
  }, [now, openTime]); // Recalcula a cada segundo

  return (
    <StatCard
      title="Horas em Operação"
      value={hoursWorked}
      icon={Timer}
    />
  );
}
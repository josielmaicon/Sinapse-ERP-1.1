// src/components/pos/PosHeaderStatus.jsx

"use client"

import * as React from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusColors = {
  aberto: "text-base bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400",
  fechado: "text-base bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400",
  pausado: "text-base bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400",
};

const InfoItem = ({ label, value, className}) => (
  <div className="text-right">
    <p className="text-base text-muted-foreground">{label}</p>
    <p className="font-semibold">{value}</p>
  </div>
);

export default function PosHeaderStatus({ session }) { 
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  // ✅ Lida com o estado de 'session' ser nula (enquanto carrega)
  if (!session) {
      return (
          <div className="w-full h-full flex items-center text-xl justify-between font-mono p-4">
              <Skeleton className="h-8 w-24" />
              <div className="flex items-center gap-6">
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-24" />
              </div>
          </div>
      )
  }

  return (
    <div className="w-full h-full flex items-center text-xl justify-between font-mono p-4">
      <div className="flex items-center gap-5">
        <Badge className={cn("text-base", statusColors[session.status])}>
          {session.status.toUpperCase()}
        </Badge>
        <div className="text-base flex items-center gap-2 text-muted-foreground">
          <div className={cn("w-2 h-2 rounded-full", session.isOnline ? "bg-green-500" : "bg-red-500")} />
          <span>{session.isOnline ? "Online" : "Offline"}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
      {/* ✅ Lê dados reais da prop 'session' */}
        <InfoItem label="Operador" className="text-2xl" value={session.operador_atual.nome} />
        <InfoItem label="Caixa" value={session.nome} /> {/* O nome do PDV */}
        <InfoItem label="Venda Nº" value={session.currentSaleId || "---"} />
        <InfoItem label="Horário" value={format(currentTime, "HH:mm:ss")} />
      </div>
    </div>
  );
}
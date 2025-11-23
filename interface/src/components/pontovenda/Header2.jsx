"use client"

import * as React from "react"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"; 

const statusColors = {
  aberto: "text-base bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400",
  fechado: "text-base bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400",
  pausado: "text-base bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400",
  loading: "text-base bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400",
  typing: "text-base bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400",
  em_andamento: "text-base bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400",
  default: "text-base bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400"
};

const InfoItem = ({ label, value, className}) => (
  <div className="text-right">
    <p className="text-base text-muted-foreground">{label}</p>
    <p className={cn("font-semibold", className)}>{value}</p>
  </div>
);

export default function PosHeaderStatus({ session }) { 
  const [currentTime, setCurrentTime] = React.useState(new Date());

  React.useEffect(() => {
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  if (!session) {
      return (
          <div className="w-full h-full flex items-center text-xl justify-between font-mono p-4">
              <div className="flex items-center gap-5">
                 <Skeleton className="h-8 w-24" />
                 <Skeleton className="h-4 w-20" />
            </div>
              <div className="flex items-center gap-6">
                  <Skeleton className="h-12 w-32" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-24" />
                  <Skeleton className="h-12 w-24" />
              </div>
          </div>
      )
  }

  const statusText = session.status || 'fechado';
  const statusClass = statusColors[statusText] || statusColors.default;
  const isOnline = session.isOnline ?? true;
  const operatorName = session.operador_atual?.nome || "---"; 
  
  const pdvName = session.nome || "Caixa";
  const saleId = session.currentSaleId || "---";

  return (
    <div className="w-full h-full flex items-center text-xl justify-between font-mono p-4">
      <div className="flex items-center gap-5">
        <Badge className={cn("text-base", statusClass)}>
          {statusText.toUpperCase()}
        </Badge>
        <div className="text-base flex items-center gap-2 text-muted-foreground">
          <div className={cn("w-2 h-2 rounded-full", isOnline ? "bg-green-500" : "bg-red-500")} />
          <span>{isOnline ? "Online" : "Offline"}</span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <InfoItem label="Operador" value={operatorName} />
        <InfoItem label="Caixa" value={pdvName} />
        <InfoItem label="Horário" value={format(currentTime, "HH:mm:ss")} />
      </div>
    </div>
  );
}
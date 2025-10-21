// src/components/products/MovementLog.jsx

"use client"

import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { History, ArrowUpCircle, ArrowDownCircle, AlertCircle, Edit } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

const logData = [
  { id: 1, date: new Date("2025-10-15T09:05:00"), type: "entrada", quantity: 100, user: "Josiel M.", note: "Pedido #582" },
  { id: 2, date: new Date("2025-10-15T11:30:00"), type: "saida-venda", quantity: -1, user: "Ana Paula", note: "Venda PDV 01" },
  { id: 3, date: new Date("2025-10-15T14:15:00"), type: "saida-venda", quantity: -2, user: "Carlos S.", note: "Venda PDV 02" },
  { id: 4, date: new Date("2025-10-14T18:00:00"), type: "ajuste", quantity: 2, user: "Josiel M.", note: "Correção de balanço" },
  { id: 5, date: new Date("2025-10-13T15:20:00"), type: "perda", quantity: -1, user: "Mariana L.", note: "Embalagem avariada" },
]

const logTypeDetails = {
  entrada: { text: "Entrada em estoque", color: "text-green-600", icon: ArrowUpCircle },
  "saida-venda": { text: "Saída por venda", color: "text-blue-600", icon: ArrowDownCircle },
  ajuste: { text: "Ajuste manual", color: "text-amber-500", icon: Edit },
  perda: { text: "Perda / avaria", color: "text-destructive", icon: AlertCircle },
}

export default function MovementLog({ product }) {
  const isLoading = !product // simplificação: sem produto → modo skeleton

  return (
    <div className="h-full flex flex-col p-4">
      {/* Cabeçalho */}
      <div className="flex-shrink-0">
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold">{product.name}</h3>
            <p className="text-sm text-muted-foreground">Histórico de movimentações</p>
          </>
        )}
        <Separator className="my-4" />
      </div>

      {/* Corpo da lista */}
      <div className="flex-grow overflow-y-auto min-h-0">
        <div className="flex flex-col gap-6">
          {isLoading ? (
            // 🦴 Skeletons — placeholders para 3 linhas
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-start gap-4">
                <Skeleton className="h-5 w-5 rounded-full" />
                <div className="flex flex-col gap-2 w-full">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))
          ) : (
            // Lista real de movimentações
            logData.map((log) => {
              const details = logTypeDetails[log.type] || {}
              const Icon = details.icon || AlertCircle
              return (
                <div key={log.id} className="flex items-start gap-4">
                  <Icon className={`mt-1 h-5 w-5 flex-shrink-0 ${details.color}`} />
                  <div className="flex flex-col">
                    <p className="font-medium">
                      <strong>{log.quantity > 0 ? `+${log.quantity}` : log.quantity} unidades</strong> ({details.text})
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {format(log.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {log.user}
                    </p>
                    {log.note && (
                      <p className="text-xs text-muted-foreground italic">Obs: {log.note}</p>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

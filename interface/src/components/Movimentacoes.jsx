// src/components/products/MovementLog.jsx

"use client"

// ❌ A ScrollArea não é mais necessária
// import { ScrollArea } from "@/components/ui/scroll-area" 
import { Separator } from "@/components/ui/separator"
import { History, ArrowUpCircle, ArrowDownCircle, AlertCircle, Edit } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// ... (Mock data e logTypeDetails continuam os mesmos)
const logData = [
  { id: 1, date: new Date("2025-10-15T09:05:00"), type: "entrada", quantity: 100, user: "Josiel M.", note: "Pedido #582" },
  { id: 2, date: new Date("2025-10-15T11:30:00"), type: "saida-venda", quantity: -1, user: "Ana Paula", note: "Venda PDV 01" },
  { id: 3, date: new Date("2025-10-15T14:15:00"), type: "saida-venda", quantity: -2, user: "Carlos S.", note: "Venda PDV 02" },
  { id: 4, date: new Date("2025-10-14T18:00:00"), type: "ajuste", quantity: 2, user: "Josiel M.", note: "Correção de balanço" },
  { id: 5, date: new Date("2025-10-13T15:20:00"), type: "perda", quantity: -1, user: "Mariana L.", note: "Embalagem avariada" },
  { id: 6, date: new Date("2025-10-12T09:00:00"), type: "entrada", quantity: 150, user: "Josiel M.", note: "Pedido #571" },
  { id: 7, date: new Date("2025-10-12T10:00:00"), type: "saida-venda", quantity: -5, user: "Ana Paula", note: "Venda PDV 01" },
  { id: 8, date: new Date("2025-10-11T11:00:00"), type: "saida-venda", quantity: -3, user: "Carlos S.", note: "Venda PDV 02" },
];

const logTypeDetails = { /* ... */ };

export default function MovementLog({ product }) {
  if (!product) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
        <History className="h-12 w-12 mb-4" />
        <h3 className="font-semibold">Histórico de Movimentações</h3>
        <p className="text-sm">Selecione um produto para ver seu histórico completo.</p>
      </div>
    );
  }

  // ✅ CORREÇÃO: Usando a mesma estrutura do PdvStatusTable
  return (
    <div className="h-full flex flex-col p-4">
      {/* Cabeçalho com altura natural */}
      <div className="flex-shrink-0">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-sm text-muted-foreground">Histórico de movimentações</p>
        <Separator className="my-4" />
      </div>

      {/* Container do conteúdo com scroll */}
      <div className="flex-grow overflow-y-auto min-h-0">
        <div className="flex flex-col gap-6">
          {logData.map((log) => {
            const details = logTypeDetails[log.type] || {};
            const Icon = details.icon || AlertCircle;
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
                  {log.note && <p className="text-xs text-muted-foreground italic">Obs: {log.note}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
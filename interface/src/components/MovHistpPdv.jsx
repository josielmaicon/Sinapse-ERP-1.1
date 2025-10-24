"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { History, Power, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableRow, TableCell } from "@/components/SimpleTable"
// ✅ 1. Importe o Tooltip e o Badge
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"


const generalLogData = [
  { id: 1, pdvName: "Caixa 01", date: new Date("2025-10-15T14:15:00"), type: "venda", value: -45.50, user: "Ana Paula", details: "Cliente #104, 3 itens" },
  { id: 2, pdvName: "Caixa 02", date: new Date("2025-10-15T14:14:00"), type: "venda", value: -12.90, user: "Carlos S.", details: "Cliente #208, 1 item" },
  { id: 3, pdvName: "Geral", date: new Date("2025-10-15T14:00:00"), type: "sangria", value: -500.00, user: "Josiel M.", details: "Retirada do Caixa 01 para o cofre" },
  { id: 4, pdvName: "Caixa 01", date: new Date("2025-10-15T13:50:00"), type: "venda", value: -88.00, user: "Ana Paula", details: "Cliente #103, 8 itens" },
  { id: 5, pdvName: "Geral", date: new Date("2025-10-15T10:00:00"), type: "suprimento", value: 100.00, user: "Josiel M.", details: "Suprimento de troco para Caixa 02" },
  { id: 6, pdvName: "Caixa 02", date: new Date("2025-10-15T08:05:00"), type: "abertura", value: 200.00, user: "Carlos S." },
  { id: 7, pdvName: "Caixa 01", date: new Date("2025-10-15T08:02:00"), type: "abertura", value: 200.00, user: "Ana Paula" },
].sort((a, b) => b.date - a.date);
const eventDetails = {
  'suprimento': { icon: ArrowUpCircle, color: "text-green-500", title: "Suprimento de Caixa" },
  'venda': { icon: ArrowDownCircle, color: "text-blue-500", title: "Saída por Venda" },
  'sangria': { icon: ArrowDownCircle, color: "text-orange-500", title: "Sangria (Retirada)" },
  'abertura': { icon: Power, color: "text-gray-500", title: "Abertura de Caixa" },
  'fechamento': { icon: Power, color: "text-red-500", title: "Fechamento de Caixa" },
  'ajuste': { icon: Power, color: "text-gray-500", title: "Ajuste Manual" },
};

export default function PdvHistoryLog({ pdv }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedLog, setSelectedLog] = React.useState(null);

  const handleLogClick = (logEntry) => {
    setSelectedLog(logEntry);
    setIsModalOpen(true);
  };
  
  const title = pdv ? `Histórico do ${pdv.name}` : "Histórico Geral";
  const dataToDisplay = pdv ? generalLogData.filter(log => log.pdvName === pdv.name || log.pdvName === "Geral") : generalLogData;

  if (dataToDisplay.length === 0) {
    return ( <div className="h-full ...">{/*... Placeholder ...*/}</div> );
  }
  
  return (
    // TooltipProvider agora envolve todo o componente
    <TooltipProvider>
      <div className="h-full w-full flex flex-col">
        <div className="flex-shrink-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Separator className="my-4" />
        </div>

        <div className="flex-grow overflow-y-auto min-h-0">
          <Table>
            <TableBody>
              {dataToDisplay.map((log) => {
                const details = eventDetails[log.type] || {};
                const Icon = details.icon || History;

                return (
                  // ✅ 2. Tooltip envolve a linha inteira
                  <Tooltip key={log.id}>
                    <TooltipTrigger asChild>
                      <TableRow
                        className="cursor-pointer"
                        onClick={() => handleLogClick(log)}
                      >
                        <TableCell className="w-[40px]">
                          <Icon className={`h-5 w-5 ${details.color}`} />
                        </TableCell>

                        <TableCell>
                          <p className="text-xs text-muted-foreground">
                            {format(log.date, "HH:mm")} por {log.user}
                            {!pdv && <span className="font-semibold"> ({log.pdvName})</span>}
                          </p>
                        </TableCell>

                        <TableCell className="text-right">
                          <Badge 
                            variant="secondary" // Usa um fundo cinza claro como base
                            className={log.value >= 0 
                              ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400" 
                              : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400"
                            }
                          >
                            {log.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{details.title || "Evento Desconhecido"}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TableBody>
          </Table>
        </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detalhes da Movimentação</DialogTitle>
            <DialogDescription>
              {eventDetails[selectedLog?.type]?.title}
              {selectedLog ? ` no ${selectedLog.pdvName}` : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="grid gap-2 text-sm py-4">
              <div className="flex justify-between"><span className="text-muted-foreground">ID da Transação:</span><span>{selectedLog.id}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Data e Hora:</span><span>{format(selectedLog.date, "dd/MM/yyyy 'às' HH:mm:ss", { locale: ptBR })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Valor:</span><span className="font-bold">{selectedLog.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Operador:</span><span>{selectedLog.user}</span></div>
              {selectedLog.details && (
                <div className="flex justify-between"><span className="text-muted-foreground">Detalhes:</span><span>{selectedLog.details}</span></div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}
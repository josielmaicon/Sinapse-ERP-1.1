"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { History, Power, ArrowUpCircle, ArrowDownCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableRow, TableCell } from "@/components/SimpleTable"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// O mapa de eventos continua o mesmo
const eventDetails = {
  'suprimento': { icon: ArrowUpCircle, color: "text-green-500", title: "Suprimento" },
  'venda': { icon: ArrowDownCircle, color: "text-blue-500", title: "Venda" },
  'sangria': { icon: ArrowDownCircle, color: "text-orange-500", title: "Sangria" },
  'abertura': { icon: Power, color: "text-gray-500", title: "Abertura" },
  'fechamento': { icon: Power, color: "text-red-500", title: "Fechamento" },
};

export default function PdvHistoryLog({ pdv }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [selectedLog, setSelectedLog] = React.useState(null);
  
  // ✅ 1. ESTADOS PARA OS DADOS VINDOS DA API
  const [logData, setLogData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // ✅ 2. useEffect ATUALIZADO
  // Agora busca dados com base no 'pdv' (ou a falta dele)
  React.useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      
      // Se 'pdv' for fornecido, busca o histórico específico.
      // Senão, busca o histórico geral.
      const url = pdv 
        ? `http://localhost:8000/pdvs/${pdv.id}/history` 
        : `http://localhost:8000/history/general`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Falha ao buscar histórico");
        const data = await response.json();
        setLogData(data);
      } catch (error) {
        console.error(error);
        setLogData([]); // Limpa em caso de erro
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [pdv]); // Dispara toda vez que 'pdv' mudar

  const handleLogClick = (logEntry) => {
    setSelectedLog(logEntry);
    setIsModalOpen(true);
  };
  
  // ✅ 3. TÍTULO ATUALIZADO
  const title = pdv ? `Histórico do ${pdv.nome}` : "Histórico Geral Recente";
  
  return (
    <TooltipProvider>
      <div className="h-full w-full flex flex-col">
        <div className="flex-shrink-0">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Separator className="my-4" />
        </div>

        <div className="flex-grow overflow-y-auto min-h-0">
          <Table>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-5 w-5 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-3/4" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-1/4" /></TableCell>
                  </TableRow>
                ))
              ) : logData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                    Nenhuma movimentação encontrada.
                  </TableCell>
                </TableRow>
              ) : (
                logData.map((log) => {
                  const details = eventDetails[log.type] || {};
                  const Icon = details.icon || History;
                  
                  // ✅ 4. LÓGICA DAS CORES DA BADGE (como você pediu)
                  const isPositive = log.value >= 0;
                  const badgeColorClass = isPositive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400";

                  return (
                    <Tooltip key={log.id}>
                      <TooltipTrigger asChild>
                        <TableRow className="cursor-pointer" onClick={() => handleLogClick(log)}>
                          <TableCell className="w-[40px]">
                            <Icon className={`h-5 w-5 ${details.color}`} />
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-semibold">{details.title || log.type}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(log.date), "HH:mm")} por {log.user}
                              {/* ✅ 5. MOSTRA O NOME DO PDV SE A VISÃO FOR GERAL */}
                              {!pdv && <span className="font-semibold"> ({log.pdvName})</span>}
                            </p>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge 
                              variant="secondary"
                              className={badgeColorClass}
                            >
                              {log.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      </TooltipTrigger>
                      <TooltipContent><p>{details.title || "Evento Desconhecido"}</p></TooltipContent>
                    </Tooltip>
                  );
                })
              )}
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


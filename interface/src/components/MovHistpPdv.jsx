"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { History, LogIn, LogOut, ShoppingCart, ArrowUpCircle, ArrowDownCircle, AlertCircle, Edit } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

// Mock de dados atualizado
const generalLogData = [
  { id: 1, pdvName: "Caixa 01", date: new Date("2025-10-15T14:15:00"), type: "venda", value: -45.50, user: "Ana Paula", details: "Cliente #104, 3 itens" },
  { id: 2, pdvName: "Caixa 02", date: new Date("2025-10-15T14:14:00"), type: "venda", value: -12.90, user: "Carlos S.", details: "Cliente #208, 1 item" },
  { id: 3, pdvName: "Geral", date: new Date("2025-10-15T14:00:00"), type: "sangria", value: -500.00, user: "Josiel M.", details: "Retirada do Caixa 01 para o cofre" },
  { id: 4, pdvName: "Caixa 01", date: new Date("2025-10-15T13:50:00"), type: "venda", value: -88.00, user: "Ana Paula", details: "Cliente #103, 8 itens" },
  { id: 5, pdvName: "Geral", date: new Date("2025-10-15T10:00:00"), type: "suprimento", value: 100.00, user: "Josiel M.", details: "Suprimento de troco para Caixa 02" },
  { id: 6, pdvName: "Caixa 02", date: new Date("2025-10-15T08:05:00"), type: "abertura", value: 200.00, user: "Carlos S." },
  { id: 7, pdvName: "Caixa 01", date: new Date("2025-10-15T08:02:00"), type: "abertura", value: 200.00, user: "Ana Paula" },
].sort((a, b) => b.date - a.date)

// Mapeamento de tipos de evento para ícone, cor e título
const eventDetails = {
  venda: { icon: ShoppingCart, color: "text-green-600", title: "Venda" },
  sangria: { icon: LogOut, color: "text-red-600", title: "Sangria" },
  suprimento: { icon: LogIn, color: "text-blue-600", title: "Suprimento" },
  abertura: { icon: Edit, color: "text-purple-600", title: "Abertura de Caixa" },
  alerta: { icon: AlertCircle, color: "text-yellow-600", title: "Alerta" },
}

export default function PdvHistoryLog({ pdv }) {
  const [isModalOpen, setIsModalOpen] = React.useState(false)
  const [selectedLog, setSelectedLog] = React.useState(null)

  const handleLogClick = (logEntry) => {
    setSelectedLog(logEntry)
    setIsModalOpen(true)
  }

  // Define título e dados a exibir
  const title = pdv ? `Histórico do ${pdv.name}` : "Histórico Geral"
  const dataToDisplay = pdv
    ? generalLogData.filter(log => log.pdvName === pdv.name)
    : generalLogData

  // Caso não haja logs
  if (dataToDisplay.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
        <History className="h-10 w-10 mb-2" />
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs">Nenhum movimento registrado neste período.</p>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Separator className="my-4" />
      </div>

      {/* Lista de logs */}
      <div className="flex-grow overflow-y-auto min-h-0 pr-4">
        <div className="flex flex-col gap-1">
          {dataToDisplay.map((log) => {
            const details = eventDetails[log.type] || {}
            const Icon = details.icon || History

            return (
              <div
                key={log.id}
                className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                onClick={() => handleLogClick(log)}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${details.color}`} />
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-sm">
                      {details.title}
                      {!pdv && <span className="ml-2 font-normal text-xs text-muted-foreground">({log.pdvName})</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(log.date, "HH:mm")} por {log.user}
                    </p>
                  </div>
                  <p className={`font-bold text-sm ${log.value >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {log.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Modal */}
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
  )
}

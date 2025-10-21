"use client"

import * as React from "react"
import { format, isPast } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { User, Edit, Phone, ShieldOff, Unlock } from "lucide-react"

// MOCK de histórico
const transactionHistory = [
  { id: "TRN-105", date: "2025-10-15", description: "Compra na loja", debit: 45.50, credit: 0 },
  { id: "TRN-104", date: "2025-10-12", description: "Pagamento da fatura", debit: 0, credit: 200.00 },
  { id: "TRN-103", date: "2025-10-10", description: "Compra na loja", debit: 120.00, credit: 0 },
  { id: "TRN-102", date: "2025-10-08", description: "Compra na loja", debit: 85.75, credit: 0 },
  { id: "TRN-101", date: "2025-10-01", description: "Pagamento da fatura", debit: 0, credit: 300.00 },
]

// Mini Card de informações
const InfoBlock = ({ label, value, valueClassName = "" }) => (
  <div className="bg-muted p-3 rounded-lg text-center flex flex-col justify-center">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`font-bold text-xl tracking-tight ${valueClassName}`}>{value}</p>
  </div>
)

export default function ClientDetailPanel({ client }) {
  const isLoading = !client

  const [isBlocked, setIsBlocked] = React.useState(client?.accountStatus === "bloqueado")
  const [isTrustMode, setIsTrustMode] = React.useState(client?.trustMode || false)

  React.useEffect(() => {
    setIsBlocked(client?.accountStatus === "bloqueado")
    setIsTrustMode(client?.trustMode || false)
  }, [client])

  // Placeholder values
  const name = client?.clientName ?? "Nome do Cliente"
  const overdueBalance = client
    ? (client.status === "Atrasado" ? client.dueValue : 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "--"
  const dueDate = client ? format(new Date(client.dueDate), "dd/MM/yyyy", { locale: ptBR }) : "--"
  const spentLimit = client
    ? (client.creditLimit - client.limitAvailable).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "--"
  const totalLimit = client
    ? isTrustMode
      ? "Confiança"
      : client.creditLimit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    : "--"

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* --- PAINEL SUPERIOR --- */}
      <div className="flex-shrink-0 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{name}</h3>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => !isLoading && alert(`Editando ${client.clientName}`)}
          >
            <Edit className="h-3 w-3 mr-2" /> Editar
          </Button>
        </div>

        {/* BLOCO DE INFORMAÇÕES */}
        <div className="grid grid-cols-2 gap-3">
          <InfoBlock label="Saldo em Atraso" value={overdueBalance} valueClassName={client?.status === "Atrasado" ? "text-destructive" : ""} />
          <InfoBlock label="Próximo Vencimento" value={dueDate} valueClassName={client && isPast(new Date(client.dueDate)) && client.status !== "Em Dia" ? "text-destructive" : ""} />
          <InfoBlock label="Limite Gasto" value={spentLimit} />
          <InfoBlock label="Limite Total" value={totalLimit} valueClassName={isTrustMode ? "text-green-500" : ""} />
        </div>

        {/* AÇÕES */}
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" disabled={isLoading} onClick={() => !isLoading && alert("Alterar limite...")}>
              Alterar Limite
            </Button>
            <Button
              variant={isBlocked ? "default" : "destructive"}
              size="sm"
              disabled={isLoading}
              onClick={() => !isLoading && setIsBlocked(!isBlocked)}
            >
              {isBlocked ? <Unlock className="h-4 w-4 mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
              {isBlocked ? "Desbloquear" : "Bloquear Conta"}
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="trust-mode" checked={isTrustMode} disabled={isLoading} onCheckedChange={setIsTrustMode} />
            <Label htmlFor="trust-mode">Modo Confiança (ilimitado)</Label>
          </div>
        </div>
      </div>

      <div className="flex-grow" />

      {/* --- EXTRATO --- */}
      <div className="flex-shrink-0 flex flex-col min-h-0 h-2/5">
        <Separator className="mb-4" />
        <h4 className="font-semibold mb-2 flex-shrink-0">Extrato da Conta</h4>

        <div className="flex-grow overflow-y-auto rounded-md border">
          {isLoading ? (
            <div className="p-4 flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor (R$)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactionHistory.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{format(new Date(tx.date), "dd/MM/yy", { locale: ptBR })}</TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell className={`text-right font-medium ${tx.credit > 0 ? "text-green-600" : "text-red-600"}`}>
                      {tx.credit > 0
                        ? `+${tx.credit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`
                        : tx.debit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}

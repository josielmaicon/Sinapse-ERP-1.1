// src/components/crediario/ClientDetailPanel.jsx

"use client"

import * as React from "react"
import { format, isPast } from "date-fns"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Edit, Phone, ShieldOff, Unlock } from "lucide-react"

// MOCK: Histórico de transações do cliente selecionado
const transactionHistory = [
  { id: "TRN-105", date: "2025-10-15", description: "Compra na loja", debit: 45.50, credit: 0 },
  { id: "TRN-104", date: "2025-10-12", description: "Pagamento da fatura", debit: 0, credit: 200.00 },
  { id: "TRN-103", date: "2025-10-10", description: "Compra na loja", debit: 120.00, user: "Ana Paula" },
  { id: "TRN-102", date: "2025-10-08", description: "Compra na loja", debit: 85.75, user: "Ana Paula" },
  { id: "TRN-101", date: "2025-10-01", description: "Pagamento da fatura", debit: 0, credit: 300.00 },
];

// NOVO COMPONENTE: "Mini Card" para as informações
const InfoBlock = ({ label, value, valueClassName = "" }) => (
  <div className="bg-muted p-3 rounded-lg text-center flex flex-col justify-center">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`font-bold text-xl tracking-tight ${valueClassName}`}>{value}</p>
  </div>
);

export default function ClientDetailPanel({ client }) {
  const [isBlocked, setIsBlocked] = React.useState(client?.accountStatus === 'bloqueado');
  const [isTrustMode, setIsTrustMode] = React.useState(client?.trustMode || false);

  React.useEffect(() => {
    setIsBlocked(client?.accountStatus === 'bloqueado');
    setIsTrustMode(client?.trustMode || false);
  }, [client]);

  if (!client) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
        <User className="h-12 w-12 mb-4" />
        <h3 className="font-semibold">Nenhum cliente selecionado</h3>
        <p className="text-sm">Clique em um cliente na tabela para ver seus detalhes.</p>
      </div>
    );
  }

  const spentLimit = client.creditLimit - client.limitAvailable;
  const overdueBalance = client.status === 'Atrasado' ? client.dueValue : 0;
  const dueDate = new Date(client.dueDate);

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* --- PAINEL DE CONTROLE (Altura natural) --- */}
      <div className="flex-shrink-0 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{client.clientName}</h3>
          <Button variant="outline" size="sm" onClick={() => alert(`Editando ${client.clientName}`)}>
            <Edit className="h-3 w-3 mr-2" /> Editar
          </Button>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
            <InfoBlock 
                label="Saldo em Atraso" 
                value={overdueBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                valueClassName="text-destructive" 
            />
            <InfoBlock 
                label="Próximo Vencimento" 
                value={format(dueDate, "dd/MM/yyyy")} 
                valueClassName={isPast(dueDate) && client.status !== "Em Dia" ? "text-destructive" : ""}
            />
            <InfoBlock 
                label="Limite Gasto" 
                value={spentLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
            />
            <InfoBlock 
                label="Limite Total" 
                value={isTrustMode ? "Confiança" : client.creditLimit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                valueClassName={isTrustMode ? 'text-green-500' : ''}
            />
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Button variant="secondary" size="sm" onClick={() => alert("Alterar limite...")}>Alterar Limite</Button>
            <Button variant={isBlocked ? "default" : "destructive"} size="sm" onClick={() => setIsBlocked(!isBlocked)}>
              {isBlocked ? <Unlock className="h-4 w-4 mr-2" /> : <ShieldOff className="h-4 w-4 mr-2" />}
              {isBlocked ? "Desbloquear" : "Bloquear Conta"}
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="trust-mode" checked={isTrustMode} onCheckedChange={setIsTrustMode} />
            <Label htmlFor="trust-mode">Modo Confiança (ilimitado)</Label>
          </div>
        </div>
      </div>

      {/* O "ESPAÇADOR" FLEXÍVEL que empurra o extrato para baixo */}
      <div className="flex-grow" />

      {/* --- EXTRATO DA CONTA (Fixo no rodapé e menor) --- */}
      <div className="flex-shrink-0 flex flex-col min-h-0 h-2/5">
        <Separator className="mb-4" />
        <h4 className="font-semibold mb-2 flex-shrink-0">Extrato da Conta</h4>
        <div className="flex-grow overflow-y-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="text-right">Valor (R$)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactionHistory.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell>{format(new Date(tx.date), "dd/MM/yy")}</TableCell>
                  <TableCell>{tx.description}</TableCell>
                  <TableCell className={`text-right font-medium ${tx.credit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {tx.credit > 0 
                      ? `+${tx.credit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}` 
                      : tx.debit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
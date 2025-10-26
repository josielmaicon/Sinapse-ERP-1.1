// src/components/pdvs/operatorColumns.jsx

"use client"
import { Badge } from "@/components/ui/badge"

export const operatorColumns = [
  {
    // ✅ CORREÇÃO: Alinhado com a API (era "name")
    accessorKey: "nome",
    header: "Nome do Operador",
  },
  {
    // ✅ CORREÇÃO: Alinhado com a API (era "hoursToday")
    accessorKey: "horas_trabalhadas",
    header: "Horas no Dia",
  },
  {
    // ✅ CORREÇÃO: Alinhado com a API (era "ticketMedio")
    accessorKey: "ticket_medio",
    header: () => <div className="text-right">Ticket Médio (R$)</div>,
    cell: ({ row }) => {
      // ✅ CORREÇÃO: Lendo o valor da chave correta
      const amount = parseFloat(row.getValue("ticket_medio"))
      const formatted = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    // ✅ CORRETO: Este já estava alinhado
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      const variant = status === "ativo" ? "success" : "secondary";
      return <Badge variant={variant} className="capitalize">{status}</Badge>
    },
  },
];
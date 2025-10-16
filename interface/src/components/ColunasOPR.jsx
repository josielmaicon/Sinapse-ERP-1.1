"use client"
import { Badge } from "@/components/ui/badge"

export const operatorColumns = [
  {
    accessorKey: "name",
    header: "Nome do Operador",
  },
  {
    accessorKey: "hoursToday",
    header: "Horas no Dia",
  },
  {
    accessorKey: "ticketMedio",
    header: () => <div className="text-right">Ticket Médio (R$)</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("ticketMedio"))
      const formatted = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      const variant = status === "ativo" ? "default" : "secondary";
      return <Badge variant={variant} className="capitalize">{status}</Badge>
    },
  },
];

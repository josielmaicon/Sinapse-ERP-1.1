"use client"
import { Badge } from "@/components/ui/badge"

export const pdvColumns = [
  {
    accessorKey: "name",
    header: "Nome do PDV",
  },
  {
    accessorKey: "operator",
    header: "Operador Atual",
  },
  {
    accessorKey: "inRegister",
    header: () => <div className="text-right">Valor em Caixa (R$)</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("inRegister"))
      const formatted = amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      const variant = status === "aberto" ? "default" : status === "pausado" ? "secondary" : "destructive";
      return <Badge variant={variant} className="capitalize">{status}</Badge>
    },
  },
];

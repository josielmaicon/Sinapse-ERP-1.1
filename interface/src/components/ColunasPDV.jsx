// src/components/pdvs/pdvColumns.jsx
"use client"
import { Badge } from "@/components/ui/badge"
import { BellDot } from "lucide-react" // Importe o ícone de sino

export const pdvColumns = [
  {
    accessorKey: "name",
    header: "PDV",
    // ✅ 1. Célula customizada para mostrar o nome e o alerta
    cell: ({ row }) => {
      const { name, pendingAlert } = row.original;
      return (
        <div className="flex items-center gap-2">
          <span>{name}</span>
          {/* Se houver um alerta pendente, mostra o ícone */}
          {pendingAlert && <BellDot className="h-4 w-4 text-amber-500" />}
        </div>
      );
    },
  },
  {
    accessorKey: "operator",
    header: "Operador",
  },
  {
    accessorKey: "inRegister",
    header: () => <div className="text-right">Caixa (R$)</div>,
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
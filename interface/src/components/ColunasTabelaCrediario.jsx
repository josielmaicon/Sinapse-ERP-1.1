"use client"

import { cn } from "@/lib/utils"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { format, isPast, addDays } from "date-fns" // Importe 'addDays'

// Componente auxiliar para a Badge de status
const StatusBadge = ({ status }) => {
  const variant = status === "Em Dia" ? "success" : "destructive";
  return <Badge variant={variant}>{status}</Badge>;
};

export const crediarioColumns = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nome",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Cliente
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "cpf",
    header: "CPF",
  },
  {
    accessorKey: "saldo_devedor",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Valor Devedor
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => {
      // ✅ CORREÇÃO: Usando a chave correta
      const amount = parseFloat(row.getValue("saldo_devedor"))
      return <div className="text-right font-medium">{amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
    },
  },
  {
    accessorKey: "data_vencimento",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Dia Vencimento
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => {
        // ✅ CORREÇÃO: Lendo os dados corretos
        const dia_vencimento = row.getValue("data_vencimento");
        const status = row.original.status_conta; // Pega o status real
        
        const isOverdue = status === "Atrasado";
        return (
            <div className={cn("text-center", isOverdue && "text-destructive font-semibold")}>
                {dia_vencimento}
            </div>
        )
    },
  },
  {
    accessorKey: "status_conta",
    header: "Status",
    // ✅ CORREÇÃO: Usando a chave correta
    cell: ({ row }) => <StatusBadge status={row.getValue("status_conta")} />,
  },
  {
    accessorKey: "limite_disponivel",
    header: () => <div className="text-right">Limite Disponível</div>,
    cell: ({ row }) => {
      // ✅ CORREÇÃO: Usando a chave correta
      const amount = parseFloat(row.getValue("limite_disponivel"))
      return <div className="text-right">{amount > 0 ? amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "---"}</div>;
    },
  },
];
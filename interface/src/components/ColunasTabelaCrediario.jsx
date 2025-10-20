// src/components/crediario/crediarioColumns.jsx

"use client"

import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { format, isPast } from "date-fns"

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
        // ✅ Impede que o clique no checkbox acione o onClick da linha
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "clientName",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Cliente
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "clientCpf",
    header: "CPF",
  },
  {
    accessorKey: "dueValue",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Valor Devedor
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("dueValue"))
      return <div className="text-right font-medium">{amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Vencimento
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => {
        const date = new Date(row.getValue("dueDate"));
        const adjustedDate = new Date(date.valueOf() + 1000 * 3600 * 24); 
        const isOverdue = isPast(adjustedDate) && row.original.status !== "Em Dia";
        return (
            <div className={isOverdue ? "text-destructive font-semibold" : ""}>
                {format(date, "dd/MM/yyyy")}
            </div>
        )
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "limitAvailable",
    header: () => <div className="text-right">Limite Disponível</div>,
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue("limitAvailable"))
        return <div className="text-right">{amount > 0 ? amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "---"}</div>;
    },
  },
];
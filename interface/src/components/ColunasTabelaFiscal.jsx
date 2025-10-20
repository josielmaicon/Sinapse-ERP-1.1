"use client"

import { ArrowUpDown, MoreHorizontal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

// Componente auxiliar para o status, para manter o código limpo
const StatusBadge = ({ status }) => {
  switch (status) {
    case "emitida":
      return <Badge variant="success">Emitida</Badge>;
    case "pendente":
      return (
        <Badge variant="secondary" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Pendente
        </Badge>
      );
    case "nao_declarar":
      return <Badge variant="outline">Não Declarar</Badge>;
    case "rejeitada":
        return <Badge variant="destructive">Rejeitada</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

export const fiscalColumns = [
  {
    id: "select",
    header: ({ table }) => ( <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" /> ),
    cell: ({ row }) => ( <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" /> ),
  },
  {
    accessorKey: "status",
    header: "Status Fiscal",
    cell: ({ row }) => <StatusBadge status={row.getValue("status")} />,
  },
  {
    accessorKey: "nfNumber",
    header: "Nº da Nota",
  },
  {
    accessorKey: "saleDate",
    header: ({ column }) => ( <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Data da Venda<ArrowUpDown className="ml-2 h-4 w-4" /></Button> ),
    cell: ({ row }) => format(new Date(row.getValue("saleDate")), "dd/MM/yyyy"),
  },
  {
    accessorKey: "issueDate",
    header: "Data de Emissão",
    cell: ({ row }) => row.getValue("issueDate") ? format(new Date(row.getValue("issueDate")), "dd/MM/yyyy") : "---",
  },
  {
    accessorKey: "saleValue",
    header: () => <div className="text-right">Valor da Venda</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("saleValue"))
      return <div className="text-right font-medium">{amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const sale = row.original;
      const isPending = sale.status === 'pendente';
      const isIssued = sale.status === 'emitida';

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem disabled={!isPending} onClick={() => alert(`Emitindo NFe para venda ${sale.id}`)}>
              Emitir NFe
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!isPending} onClick={() => alert(`Marcando venda ${sale.id} para não declarar`)}>
              Marcar como 'Não Declarar'
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled={!isIssued} onClick={() => alert(`Cancelando NFe da venda ${sale.id}`)}>
              Cancelar NFe
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!isIssued} onClick={() => alert(`Baixando DANFE da venda ${sale.id}`)}>
              Imprimir DANFE
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!isIssued} onClick={() => alert(`Baixando XML da venda ${sale.id}`)}>
              Baixar XML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];
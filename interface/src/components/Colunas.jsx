// src/components/products/columns.jsx

"use client"

import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format, differenceInDays, isPast } from "date-fns" // Importe as funções de data

export const columns = [
  {
    id: "select",
    header: ({ table }) => (
      // ✅ 1. CÓDIGO DO CHECKBOX DO HEADER RESTAURADO
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
      // ✅ 2. CÓDIGO DO CHECKBOX DA LINHA RESTAURADO
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        // Esta é a mágica para a multi-seleção:
        // Impede que o clique no checkbox acione o clique da linha
        onClick={(e) => e.stopPropagation()} 
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nome", 
    header: "Nome do Produto",
  },
  {
    accessorKey: "categoria", 
    header: "Categoria",
  },
  {
    accessorKey: "quantidade_estoque", 
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Quantidade
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("quantidade_estoque")}</div>,
  },
  {
    accessorKey: "atualizado_em", // Mantenha este se for a sua data de vencimento
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Vencimento (dias)
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const expiryDate = row.original.atualizado_em;
      if (!expiryDate) return <Badge variant="secondary">N/A</Badge>;

      const days = differenceInDays(new Date(expiryDate), new Date());
      let variant = "success";
      if (days < 0) variant = "destructive";
      else if (days <= 7) variant = "default";
      
      const text = isPast(new Date(expiryDate)) ? "Vencido" : `${days} dias`;

      return <Badge variant={variant}>{text}</Badge>;
    },
  },
  {
    // ✅ 3. CÓDIGO DO MENU DE AÇÕES POR LINHA RESTAURADO
    id: "actions",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => alert(`Editando ${product.nome}`)}>
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => alert(`Duplicando ${product.nome}`)}>
              Duplicar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500">Excluir</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];
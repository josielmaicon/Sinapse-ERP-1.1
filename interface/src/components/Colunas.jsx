// src/components/products/columns.jsx

"use client"

import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox" // ✅ 1. Importe o Checkbox
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export const columns = [
  // ✅ 2. Adicione esta nova definição de coluna no início do array
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
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  // ... o resto das suas colunas (Nome, Categoria, etc.) continua aqui
  {
    accessorKey: "name",
    header: "Nome do Produto",
  },
  {
    accessorKey: "category",
    header: "Categoria",
  },
  {
    accessorKey: "quantity",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Quantidade
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="text-center">{row.getValue("quantity")}</div>,
  },
  {
    accessorKey: "daysUntilExpiry",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Vencimento (dias)
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const days = row.getValue("daysUntilExpiry");
      let variant = "secondary";
      if (days < 0) variant = "destructive";
      else if (days <= 7) variant = "default";
      
      const text = days < 0 ? "Vencido" : days;

      return <Badge variant={variant}>{text}</Badge>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      // ... (menu de ações continua o mesmo)
    },
  },
];
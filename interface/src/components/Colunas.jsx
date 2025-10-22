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
{
    id: "select",
    header: ({ table }) => ( <Checkbox /* ... */ /> ),
    cell: ({ row }) => ( <Checkbox /* ... */ /> ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    // ✅ CORREÇÃO: Alinhado com o models.py
    accessorKey: "nome", 
    header: "Nome do Produto",
  },
  {
    // ✅ CORREÇÃO: Alinhado com o models.py
    accessorKey: "categoria", 
    header: "Categoria",
  },
  {
    // ✅ CORREÇÃO: Alinhado com o models.py
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
    // ✅ LÓGICA INTELIGENTE: Campo derivado para o vencimento
    accessorKey: "vencimento_em", // Usamos um novo accessorKey virtual
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Vencimento (dias)
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const expiryDate = row.original.atualizado_em; // Supondo que 'atualizado_em' seja a data de vencimento por enquanto
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
    id: "actions",
    cell: ({ row }) => {
      // ... (menu de ações continua o mesmo)
    },
  },
];
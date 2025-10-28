"use client"

import { ArrowUpDown, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
// Importar DropdownMenu se for usar ações
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu" 
import { format } from "date-fns"
// import { ptBR } from "date-fns/locale"; // Descomente se precisar formatar datas com localidade

// Componente auxiliar simples para formatar moeda
const formatCurrency = (value) => {
  const amount = parseFloat(value);
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(isNaN(amount) ? 0 : amount);
};

export const notaEntradaColumns = [
  // Coluna de Seleção (opcional, mas útil para ações em lote futuras)
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
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
  // Coluna: Número da Nota
  {
    accessorKey: "numero_nota",
    header: "Número",
    cell: ({ row }) => {
      const numero = row.getValue("numero_nota");
      return numero || "---"; // Mostra '---' se for nulo
    },
  },
  // Coluna: Chave de Acesso (talvez mostrar só parte?)
  {
    accessorKey: "chave_acesso",
    header: "Chave NFe",
    cell: ({ row }) => {
      const chave = row.getValue("chave_acesso");
      // Exemplo: Mostrar apenas os últimos 9 dígitos para economizar espaço
      return chave ? `...${chave.slice(-9)}` : "---"; 
    },
  },
  // Coluna: Data de Emissão (com ordenação)
  {
    accessorKey: "data_emissao",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data Emissão
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.getValue("data_emissao");
      try {
        // Formata a data (YYYY-MM-DD vinda do backend)
        return date ? format(new Date(date + 'T00:00:00'), "dd/MM/yyyy") : "---"; // Adiciona T00:00:00 para evitar problemas de fuso
      } catch (e) {
        return "Inválida";
      }
    },
  },
  // Coluna: Fornecedor (Nome)
  {
    accessorKey: "fornecedor", // Acessa o objeto fornecedor
    header: "Fornecedor",
    cell: ({ row }) => {
      const fornecedor = row.getValue("fornecedor");
      return fornecedor ? fornecedor.nome : "Não identificado";
    },
    // Filtro pode ser adicionado depois, buscando pelo nome do fornecedor
  },
   // Coluna: Valor Total (com ordenação e alinhamento)
  {
    accessorKey: "valor_total",
    header: ({ column }) => (
      <div className="text-right">
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Valor Total
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </div>
    ),
    cell: ({ row }) => {
      const amount = row.getValue("valor_total");
      return <div className="text-right font-medium">{formatCurrency(amount)}</div>;
    },
  },
  // Coluna de Ações (Exemplo inicial)
  {
    id: "actions",
    cell: ({ row }) => {
      const nota = row.original; // Pega o objeto completo da nota

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações - NFe Entrada</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => alert(`Visualizando detalhes da NFe ${nota.id}`)}>
              Ver Detalhes
            </DropdownMenuItem>
            {/* Ação futura: Gerar Devolução */}
            <DropdownMenuItem onClick={() => alert(`Iniciando devolução para NFe ${nota.id}`)}>
              Gerar Devolução
            </DropdownMenuItem>
            {/* Ação futura: Manifestar */}
             <DropdownMenuItem onClick={() => alert(`Registrando manifestação para NFe ${nota.id}`)}>
              Manifestar (MD-e)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
             {/* Ação simples: Marcar status interno */}
             <DropdownMenuItem onClick={() => alert(`Marcando NFe ${nota.id} como Conferida`)}>
              Marcar como Conferida
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];
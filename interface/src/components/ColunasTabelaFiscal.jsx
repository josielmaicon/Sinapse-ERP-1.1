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
      return <Badge variant="success" className="bg-green-500/80">Emitida</Badge>; // Supondo que você tenha uma variante 'success'
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
    case "cancelada":
        return <Badge variant="destructive" className="bg-red-500/80">Cancelada</Badge>;
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
    // ✅ CORREÇÃO: O campo no modelo é 'status_fiscal'
    accessorKey: "status_fiscal",
    header: "Status Fiscal",
    // ✅ CORREÇÃO: O 'getValue' agora usa a chave correta
    cell: ({ row }) => <StatusBadge status={row.getValue("status_fiscal")} />,
  },
  {
    accessorKey: "nota_fiscal_saida", // Acessa o objeto aninhado
    header: "Nº da Nota",
    cell: ({ row }) => {
      // Lê o objeto aninhado e exibe o ID dele (ou 'chave_acesso' se preferir)
      const nota = row.original.nota_fiscal_saida;
      return nota ? nota.id : "---"; // Exibe '---' se não houver nota
    },
  },
  {
    // ✅ CORREÇÃO: O campo no modelo é 'data_hora'
    accessorKey: "data_hora",
    header: ({ column }) => ( <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Data da Venda<ArrowUpDown className="ml-2 h-4 w-4" /></Button> ),
    cell: ({ row }) => format(new Date(row.getValue("data_hora")), "dd/MM/yy HH:mm"),
  },
  {
    id: "data_emissao", // ID virtual, pois o dado é aninhado
    header: "Data de Emissão",
    cell: ({ row }) => {
      // ✅ CORREÇÃO: Lendo o dado aninhado que vem da API
      const issueDate = row.original.nota_fiscal_saida?.data_hora_autorizacao;
      return issueDate ? format(new Date(issueDate), "dd/MM/yy HH:mm") : "---";
    },
  },
  {
    // ✅ CORREÇÃO: O campo no modelo é 'valor_total'
    accessorKey: "valor_total",
    header: () => <div className="text-right">Valor da Venda</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("valor_total"))
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
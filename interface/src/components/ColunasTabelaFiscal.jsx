"use client"

import { ArrowUpDown, MoreHorizontal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { cn } from "@/lib/utils" // Importe o 'cn' para o 'spin'

// ✅ 1. COMPONENTE DE STATUS UNIFICADO E MAIS INTELIGENTE
const StatusBadge = ({ status }) => {
  // Se o status for nulo ou indefinido, não renderiza nada
  if (!status) return null;

  // Normaliza o status para minúsculas para evitar erros de case
  const statusNormalizado = status.toLowerCase();
  
  let variant = "secondary";
  let text = status;
  let spin = false;

  switch (statusNormalizado) {
    case "autorizada":
    case "emitida":
      variant = "success";
      text = "Emitida";
      break;
    case "em processamento":
    case "pendente":
      variant = "secondary";
      text = "Pendente";
      spin = true;
      break;
    case "nao_declarar":
    case "não declarar":
      variant = "outline";
      text = "Não Declarar";
      break;
    case "rejeitada":
      variant = "destructive";
      text = "Rejeitada";
      break;
    case "cancelada":
      variant = "destructive";
      text = "Cancelada";
      break;
  }

  return (
    <Badge variant={variant} className={cn(spin && "flex items-center gap-1")}>
      {spin && <Loader2 className="h-3 w-3 animate-spin" />}
      {text}
    </Badge>
  );
};

export const fiscalColumns = [
  {
    id: "select",
    header: ({ table }) => ( <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" /> ),
    cell: ({ row }) => ( <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" /> ),
  },
  {
    accessorKey: "status_fiscal",
    header: "Status Fiscal",
    // ✅ 2. A LÓGICA DE DECISÃO DO STATUS
    cell: ({ row }) => {
      const venda = row.original;
      
      // Tenta pegar o status da SEFAZ (da nota fiscal, se ela existir)
      const statusSefaz = venda.nota_fiscal_saida?.status_sefaz;
      
      // Pega o status interno da venda
      const statusInterno = venda.status_fiscal;

      // Prioriza o status da SEFAZ. Se não houver nota, usa o status interno da venda.
      const finalStatus = statusSefaz || statusInterno;

      return <StatusBadge status={finalStatus} />;
    },
  },
  {
    accessorKey: "nota_fiscal_saida",
    header: "Nº da Nota",
    cell: ({ row }) => {
      const nota = row.original.nota_fiscal_saida;
      // Mostra o ID da nota (ou 'chave_acesso' se preferir)
      return nota ? nota.id : "---"; 
    },
  },
  {
    accessorKey: "data_hora",
    header: ({ column }) => ( <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Data da Venda<ArrowUpDown className="ml-2 h-4 w-4" /></Button> ),
    cell: ({ row }) => format(new Date(row.getValue("data_hora")), "dd/MM/yy HH:mm"),
  },
  {
    id: "data_emissao",
    header: "Data de Emissão",
    cell: ({ row }) => {
      const issueDate = row.original.nota_fiscal_saida?.data_hora_autorizacao;
      return issueDate ? format(new Date(issueDate), "dd/MM/yy HH:mm") : "---";
    },
  },
  {
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
      // ✅ 3. LÓGICA DE AÇÕES CORRIGIDA
      const finalStatus = sale.nota_fiscal_saida?.status_sefaz || sale.status_fiscal;
      const isPending = finalStatus === 'pendente';
      const isIssued = finalStatus === 'autorizada' || finalStatus === 'emitida';

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
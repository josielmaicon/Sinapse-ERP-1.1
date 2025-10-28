"use client"

import { ArrowUpDown, MoreHorizontal, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// --- COMPONENTE DE STATUS CORRIGIDO ---
const StatusBadge = ({ status }) => {
  if (!status) return null;
  const statusNormalizado = status.toLowerCase();

  let variant = "secondary";
  let text = status;
  let spin = false; // Loading padrão é FALSO

  switch (statusNormalizado) {
    case "autorizada":
    case "emitida":
      variant = "success";
      text = "Emitida";
      break;
    case "pendente": // ✅ Loading REMOVIDO daqui
      // variant = "secondary"; // Pode manter ou mudar para outline
      variant = "outline"; // Exemplo: Deixar mais sutil
      text = "Pendente";
      // spin = false; // Já é o padrão
      break;
    case "enviando": // ✅ NOVO STATUS TEMPORÁRIO com loading
    case "processando":
       variant = "info"; // Ex: Azul para indicar ação em progresso
       text = "Enviando...";
       spin = true; // ✅ Loading ATIVO aqui
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
    case "erro": // Opcional: Status para erro na emissão
       variant = "destructive";
       text = "Erro Emissão";
       spin = false;
       break;
    // Adicione um default case se quiser tratar status inesperados
     default:
       text = status // Mostra o status original se não reconhecido
       variant = "secondary"
  }

  return (
    <Badge variant={variant} className={cn(spin && "flex items-center gap-1")}>
      {spin && <Loader2 className="h-3 w-3 animate-spin" />}
      {text}
    </Badge>
  );
};

// --- DEFINIÇÃO DAS COLUNAS CORRIGIDA ---
export const fiscalColumns = [
  {
    id: "select",
    header: ({ table }) => ( <Checkbox checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" /> ),
    cell: ({ row }) => ( <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" /> ),
  },
  {
    accessorKey: "status_fiscal", // O accessor continua lendo o campo base
    header: "Status Fiscal",
    cell: ({ row, table }) => {
      const venda = row.original;
      const statusSefaz = venda.nota_fiscal_saida?.status_sefaz;
      const statusInterno = venda.status_fiscal;
      // Lógica para determinar o status "real" (como antes)
      const finalStatus = statusSefaz || statusInterno;

      // Verifica se esta venda está sendo enviada (lendo do meta)
      const isSending = table.options.meta?.sendingIds?.has(venda.id);

      // Determina qual status mostrar: "enviando" ou o status real
      const displayStatus = isSending ? "enviando" : finalStatus;

      // Renderiza o Badge com o status correto (que terá ou não o loading)
      return <StatusBadge status={displayStatus} />;
    },
  },
  {
    accessorKey: "nota_fiscal_saida",
    header: "Nº da Nota",
    cell: ({ row }) => {
      const nota = row.original.nota_fiscal_saida;
      // Mostra o ID da nota OU a chave de acesso, se preferir
      // return nota ? (nota.chave_acesso ? nota.chave_acesso.slice(-9) : nota.id) : "---"; // Exemplo com chave
      return nota ? nota.id : "---"; // Mantendo ID por enquanto
    },
  },
  {
    accessorKey: "data_hora",
    header: ({ column }) => ( <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Data da Venda<ArrowUpDown className="ml-2 h-4 w-4" /></Button> ),
    cell: ({ row }) => {
       try {
         // Adiciona try-catch para datas inválidas
         return format(new Date(row.getValue("data_hora")), "dd/MM/yy HH:mm");
       } catch (e) {
         return "Data inválida";
       }
    }
  },
  {
    id: "data_emissao",
    header: "Data de Emissão",
    cell: ({ row }) => {
      const issueDate = row.original.nota_fiscal_saida?.data_hora_autorizacao;
      try {
        return issueDate ? format(new Date(issueDate), "dd/MM/yy HH:mm") : "---";
      } catch (e) {
        return "Data inválida";
      }
    },
  },
  {
    accessorKey: "valor_total",
    header: () => <div className="text-right">Valor da Venda</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("valor_total"));
      const formatted = new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
      }).format(isNaN(amount) ? 0 : amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => { // Recebe 'table' para acessar o 'meta'
      const sale = row.original;
      const statusSefaz = sale.nota_fiscal_saida?.status_sefaz;
      const statusInterno = sale.status_fiscal;
      const finalStatus = statusSefaz || statusInterno;

      // Lógica MAIS PRECISA para saber se PODE emitir
      // Uma venda só pode ser emitida se seu status final NÃO for um dos status terminais.
      const statusFinais = ['autorizada', 'emitida', 'cancelada', 'rejeitada', 'nao_declarar', 'não declarar'];
      const podeEmitir = !statusFinais.includes(finalStatus?.toLowerCase());

      // Lógica para saber se PODE cancelar/imprimir/baixar (status emitido com sucesso)
      const isIssuedSuccessfully = ['autorizada', 'emitida'].includes(finalStatus?.toLowerCase());

      // Pega a função handleEmit do meta
      const handleEmit = table.options.meta?.handleEmitSingleNote;
      // Verifica se esta linha está sendo enviada
      const isSending = table.options.meta?.sendingIds?.has(sale.id);

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            {/* ✅ CORREÇÃO AQUI: onClick chama handleEmit, disabled verifica 'podeEmitir' e 'isSending' */}
            <DropdownMenuItem
              disabled={!podeEmitir || isSending} // Só pode emitir se o status final permitir E não estiver enviando
              onClick={() => handleEmit?.(sale.id)} // Chama a função real
            >
              {isSending ? "Enviando..." : "Emitir NFe"} {/* Muda o texto */}
            </DropdownMenuItem>
            {/* Mantém a ação de 'Não Declarar' se ainda puder emitir */}
             <DropdownMenuItem
               disabled={!podeEmitir || isSending}
               onClick={() => alert(`Marcando venda ${sale.id} para não declarar`)}
             >
              Marcar como 'Não Declarar'
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {/* Habilita ações de cancelamento/download apenas se emitida com sucesso */}
            <DropdownMenuItem disabled={!isIssuedSuccessfully} onClick={() => alert(`Cancelando NFe da venda ${sale.id}`)}>
              Cancelar NFe
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!isIssuedSuccessfully} onClick={() => alert(`Baixando DANFE da venda ${sale.id}`)}>
              Imprimir DANFE
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!isIssuedSuccessfully} onClick={() => alert(`Baixando XML da venda ${sale.id}`)}>
              Baixar XML
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];
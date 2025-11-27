"use client"

import { ArrowUpDown, MoreHorizontal, Loader2, AlertCircle, FilePlus, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

// --- COMPONENTE DE STATUS (Sem alterações) ---
const StatusBadge = ({ status }) => {
  if (!status) return <Badge variant="outline" className="text-muted-foreground border-dashed border-slate-400">Não Gerada</Badge>; // Fallback visual
  
  const s = status.toLowerCase();
  let variant = "secondary";
  let text = status;
  let spin = false; 

  switch (s) {
    case "autorizada":
    case "emitida":
      variant = "success"; text = "Emitida"; break; // Ajuste se tiver cor 'success' no theme ou use 'default' e className bg-green
    case "pendente":
      variant = "outline"; text = "Pendente"; break;
    case "enviando":
    case "processando":
       variant = "secondary"; text = "Enviando..."; spin = true; break;
    case "nao_declarar":
      variant = "outline"; text = "Não Declarar"; break;
    case "rejeitada":
      variant = "destructive"; text = "Rejeitada"; break;
    case "cancelada":
      variant = "destructive"; text = "Cancelada"; break;
    case "erro": 
       variant = "destructive"; text = "Erro Emissão"; spin = false; break;
    default:
       text = status; variant = "secondary";
  }

  return (
    <Badge variant={variant} className={cn(spin && "gap-1", variant === 'success' && "bg-green-100 text-green-800 hover:bg-green-200 border-transparent")}>
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
    id: "status_real",
    header: "Situação",
    cell: ({ row, table }) => {
      const venda = row.original;
      const nota = venda.nota_fiscal_saida;
      
      // Se não tem nota, é "Não Gerada". Se tem, usa o status dela.
      const statusReal = nota ? nota.status_sefaz : null;
      
      // Verifica se está enviando (pelo ID da nota ou da venda)
      const isSending = table.options.meta?.sendingIds?.has(nota?.id || `venda-${venda.id}`);
      
      return <StatusBadge status={isSending ? "enviando" : statusReal} />;
    },
  },
  {
    id: "identificacao",
    header: "Nº Nota", // Mudei de "Ref." para ser mais específico
    cell: ({ row }) => {
        const venda = row.original;
        const nota = venda.nota_fiscal_saida;

        if (nota) {
            // ✅ CASO 1: Tem Nota -> Mostra só o número, fonte padrão
            // Usamos 'font-medium' para alinhar com o peso visual das outras colunas importantes
            return <span className="font-medium">{nota.numero || 'S/N'}</span>;
        }

        // ✅ CASO 2: Sem Nota -> Mantemos o ícone de alerta, mas na mesma linha
        return (
            <span className="flex items-center gap-2 text-amber-600 font-medium">
                <AlertCircle className="h-4 w-4" /> Sem Nota
            </span>
        );
    }
  },
  {
    accessorKey: "data_hora",
    header: ({ column }) => ( <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>Data Venda<ArrowUpDown className="ml-2 h-4 w-4" /></Button> ),
    cell: ({ row }) => {
       try { return format(new Date(row.getValue("data_hora")), "dd/MM/yy HH:mm"); } 
       catch (e) { return "Data inválida"; }
    }
  },
  {
    id: "data_emissao",
    header: "Data Emissão",
    cell: ({ row }) => {
      const issueDate = row.original.nota_fiscal_saida?.data_emissao; // Usa data_emissao ou data_hora_autorizacao
      try { return issueDate ? format(new Date(issueDate), "dd/MM/yy HH:mm") : "---"; } 
      catch (e) { return "---"; }
    },
  },
  {
    accessorKey: "valor_total",
    header: () => <div className="text-right">Valor</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("valor_total"));
      const formatted = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(isNaN(amount) ? 0 : amount);
      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => { 
      const sale = row.original;
      // ✅ 1. DEFININDO A VARIÁVEL 'NOTA' (O que faltava)
      const nota = sale.nota_fiscal_saida;
      
      const statusSefaz = nota?.status_sefaz;
      const finalStatus = statusSefaz || 'pendente';

      const statusFinais = ['autorizada', 'emitida', 'cancelada', 'nao_declarar'];
      // Pode emitir se NÃO for um status final. Se não tem nota, pode emitir (gerar).
      const podeEmitir = !statusFinais.includes(finalStatus?.toLowerCase());
      const isIssuedSuccessfully = ['autorizada', 'emitida'].includes(finalStatus?.toLowerCase());

      const handleEmit = table.options.meta?.handleEmitSingleNote;
      
      // Verifica envio (usando ID da nota ou da venda para garantir match)
      const isSending = table.options.meta?.sendingIds?.has(nota?.id) || table.options.meta?.sendingIds?.has(`venda-${sale.id}`);

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            
            {/* ✅ 2. LÓGICA HÍBRIDA: GERAR OU TRANSMITIR */}
            {nota ? (
                <DropdownMenuItem
                  disabled={!podeEmitir || isSending}
                  // Chama transmitir passando o ID da Nota
                  onClick={() => handleEmit?.(nota.id, 'transmitir')} 
                >
                  {isSending ? <><Loader2 className="mr-2 h-3 w-3 animate-spin"/> Enviando...</> : <><Send className="mr-2 h-4 w-4" /> Transmitir SEFAZ</>}
                </DropdownMenuItem>
            ) : (
                <DropdownMenuItem
                  disabled={isSending}
                  // Chama gerar passando o ID da Venda
                  onClick={() => handleEmit?.(sale.id, 'gerar')} 
                >
                   {isSending ? <><Loader2 className="mr-2 h-3 w-3 animate-spin"/> Gerando...</> : <><FilePlus className="mr-2 h-4 w-4" /> Gerar NFe</>}
                </DropdownMenuItem>
            )}

            <DropdownMenuItem
               disabled={!podeEmitir || isSending}
               onClick={() => alert(`Marcando venda ${sale.id} para não declarar`)}
             >
              Marcar como 'Não Declarar'
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            {/* Ações de Pós-Emissão */}
            <DropdownMenuItem disabled={!isIssuedSuccessfully} onClick={() => alert("Cancelamento Fiscal em breve")}>
              Cancelar NFe
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!isIssuedSuccessfully} onClick={() => alert("Download PDF em breve")}>
              Imprimir DANFE
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!isIssuedSuccessfully} onClick={() => alert("Download XML em breve")}>
              Baixar XML
            </DropdownMenuItem>

             {/* Visualizar Erro (Se houver) */}
             {nota?.xmotivo && !isIssuedSuccessfully && (
                 <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => alert(nota.xmotivo)} className="text-destructive">
                        <AlertCircle className="mr-2 h-4 w-4" /> Ver Erro
                    </DropdownMenuItem>
                 </>
             )}

          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
];
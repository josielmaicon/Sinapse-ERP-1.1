"use client"
import { Badge } from "@/components/ui/badge"
import { BellDot, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const StatusBadge = ({ status }) => {
  let className = "";
  let text = status;

  if (!status) {
    status = "fechado"; // Padrão
  }
  const normalizedStatus = status.toLowerCase();

  switch (normalizedStatus) {
    case "aberto":
      text = "Aberto";
      className = "bg-green-100 text-green-800 border-transparent hover:bg-green-100/80 dark:bg-green-900/50 dark:text-green-400";
      break;
    case "fechado":
      text = "Fechado";
      className = "bg-red-100 text-red-800 border-transparent hover:bg-red-100/80 dark:bg-red-900/50 dark:text-red-400";
      break;
    case "pausado":
      text = "Pausado";
      className = "bg-yellow-100 text-yellow-800 border-transparent hover:bg-yellow-100/80 dark:bg-yellow-900/50 dark:text-yellow-400";
      break;
    default:
      text = status; 
      return <Badge variant="secondary">{text}</Badge>;
  }
  return <Badge className={cn(className, "capitalize")}>{text}</Badge>;
};

export const pdvColumns = [
  {
    accessorKey: "nome",
    header: "PDV",
    cell: ({ row }) => {
      // ✅ CORREÇÃO: Ler 'alerta_pendente' em vez de 'solicitacoes'
      const { nome, alerta_pendente } = row.original;
      
      // ✅ A lógica de alerta agora verifica se o objeto não é nulo
      const hasAlert = alerta_pendente != null; 
      
      return (
        <div className="flex items-center gap-2">
          <span>{nome}</span>
          {/* O sino agora aparece se 'alerta_pendente' existir */}
          {hasAlert && (
            <BellDot className="h-4 w-4 text-amber-500 animate-pulse" />
          )}
        </div>
      );
    },
  },
  {
    // ✅ Corrigido: A API envia 'operador_atual'
    accessorKey: "operador_atual",
    header: "Operador",
    cell: ({ row }) => {
      // Acessamos o nome dentro do objeto aninhado
      const operador = row.getValue("operador_atual");
      return operador ? operador.nome : "---";
    },
  },
{
    // ✅ 1. CORRIJA O accessorKey
    accessorKey: "valor_em_caixa", // <--- DE 'inRegister' PARA O NOME REAL DA API
    header: () => <div className="text-right">Caixa (R$)</div>,
    // ✅ 2. ATUALIZE A CÉLULA para ler e formatar o valor
    cell: ({ row }) => {
      // Pega o valor numérico da linha
      const amount = parseFloat(row.getValue("valor_em_caixa"))

      // Formata como moeda brasileira (BRL)
      const formatted = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>
    },
  },
  {
    // ✅ Corrigido: A API envia 'status'
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status");
      const variant = status === "aberto" ? "success" : status === "pausado" ? "secondary" : "destructive";
      return <Badge variant={variant} className="capitalize">{status}</Badge>
    },
  },
];
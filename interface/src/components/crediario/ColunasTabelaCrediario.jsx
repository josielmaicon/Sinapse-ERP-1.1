"use client"

import { cn } from "@/lib/utils"
import { ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { format, isPast, addDays } from "date-fns" // Importe 'addDays'

// Componente auxiliar para a Badge de status
const StatusBadge = ({ status }) => {
  let className = "";
  let text = status;
  let variant = "secondary";

  if (!status) {
    status = "inativo"; // Define um padrão
  }

  const normalizedStatus = status.toLowerCase(); // Garante consistência

  switch (normalizedStatus) {
    case "ativo":
      text = "Ativo";
      variant = "outline";
      break;
    case "atrasado":
      text = "Atrasado";
      // Classes para Amarelo (fundo claro, texto escuro)
      className = "bg-yellow-100 text-yellow-800 border-transparent hover:bg-yellow-100/80 dark:bg-yellow-900/50 dark:text-yellow-400";
      break;
    case "bloqueado":
      text = "Bloqueado";
      // Usa a variant 'destructive' (vermelho) que já existe
      return <Badge variant="destructive">{text}</Badge>;
    case "inativo":
      text = "Inativo";
      // Usa a variant 'secondary' (cinza) que já existe
      return <Badge variant="secondary">{text}</Badge>;
    default:
      text = status; // Mostra o status desconhecido
      return <Badge variant="secondary">{text}</Badge>;
  }

  // Retorna a Badge com as classes customizadas (para Ativo e Atrasado)
  // 'cn' mescla as classes padrão da Badge com as nossas
  return <Badge variant={variant} className={cn(className)}>{text}</Badge>;
};

export const crediarioColumns = [
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
        onClick={(e) => e.stopPropagation()}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "nome",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Cliente
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "cpf",
    header: "CPF",
  },
  {
    accessorKey: "saldo_devedor",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Valor Devedor
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => {
      // ✅ CORREÇÃO: Usando a chave correta
      const amount = parseFloat(row.getValue("saldo_devedor"))
      return <div className="text-right font-medium">{amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</div>
    },
  },
  {
    accessorKey: "dia_vencimento_fatura",
    header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
            Dia Vencimento
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    ),
    cell: ({ row }) => {
        // ✅ 3. CORREÇÃO DA LEITURA
        const dia_vencimento = row.getValue("dia_vencimento_fatura");
        const status = row.original.status_conta; // Pega o status real

        // ✅ 4. CORREÇÃO DA LÓGICA DE STATUS
        const isOverdue = status === "atrasado"; // <--- VERIFICA O VALOR CORRETO
        
        return (
            <div className={cn("text-center", isOverdue && "text-destructive font-semibold")}>
                {/* Mostra 'Dia X' ou '---' se não houver dia */}
                {dia_vencimento ? `Dia ${dia_vencimento}` : "---"}
            </div>
        )
    },
  },
  {
    accessorKey: "status_conta",
    header: "Status",
    // ✅ CORREÇÃO: Usando a chave correta
    cell: ({ row }) => <StatusBadge status={row.getValue("status_conta")} />,
  },
  {
    accessorKey: "limite_disponivel",
    header: () => <div className="text-right">Limite Disponível</div>,
    cell: ({ row }) => {
      // ✅ LÓGICA CORRIGIDA: Ler 'trust_mode' para decidir
      
      const isTrustMode = row.original.trust_mode; // Pega o FATO
      
      if (isTrustMode) {
        return <div className="text-right font-medium text-primary">Ilimitado</div>
      }
      
      const amount = parseFloat(row.getValue("limite_disponivel"))
      // Mostra '---' se o limite disponível for 0 ou negativo (ou seja, estourado)
      return <div className="text-right">{amount > 0 ? amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "---"}</div>;    },
  },
];
// src/components/pdvs/pdvColumns.jsx (Corrigido)
"use client"
import { Badge } from "@/components/ui/badge"
import { BellDot } from "lucide-react"

export const pdvColumns = [
  {
    // ✅ Corrigido: A API envia 'nome' (pt-br)
    accessorKey: "nome",
    header: "PDV",
    cell: ({ row }) => {
      const { nome, solicitacoes } = row.original;
      // ✅ Lógica de alerta: verifica se existe alguma solicitação
      const hasAlert = solicitacoes && solicitacoes.length > 0;
      return (
        <div className="flex items-center gap-2">
          <span>{nome}</span>
          {hasAlert && <BellDot className="h-4 w-4 text-amber-500" />}
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
    // 🚧 Este campo não vem da API '/api/pdvs' ainda
    // Vamos deixar um placeholder por enquanto
    accessorKey: "inRegister",
    header: () => <div className="text-right">Caixa (R$)</div>,
    cell: () => {
      return <div className="text-right font-medium">R$ 0,00</div>
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
"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, Check, X } from "lucide-react"

export default function PdvAlertPanel({ alert, onResolve }) {
  if (!alert) {
    return null; // Não mostra nada se não houver alerta
  }

  // ✅ INÍCIO DA CORREÇÃO (O "ADAPTADOR")
  // Aqui, nós "traduzimos" o payload do socket (o 'alert') 
  // para as variáveis que o seu JSX espera.

  // 1. Traduz o nome do operador
  const operator = alert.operador_nome || "Operador Desconhecido";

  // 2. Tenta extrair os detalhes (o "item" e o "valor")
  let item = alert.tipo.replace(/_/g, " "); // Fallback: "cancelamento item"
  let value = 0; // Fallback: R$ 0,00 (para evitar o erro 'toLocaleString')

  if(alert.detalhes) {
      try {
          const detalhes = JSON.parse(alert.detalhes);
          
          // (No futuro, se o 'CancelItemModal' enviar o nome e valor,
          //  nós os leríamos aqui. Ex: value = detalhes.valor_total || 0)
          
          // Por enquanto, criamos uma descrição melhor:
          if(alert.tipo === 'cancelamento_venda') {
              item = `Venda Total (ID: ${detalhes.venda_id || '?'})`;
              // (Seu payload atual não envia o valor total da venda, então 'value' será 0)
          } else if (alert.tipo === 'cancelamento_item') {
              item = `Item (ID: ${detalhes.item_db_id || '?'})`;
              // (Seu payload atual não envia o valor do item, então 'value' será 0)
          }
          
      } catch (e) {
          console.error("PdvAlertPanel: Erro ao parsear detalhes do alerta:", e);
          item = "Detalhes mal formados";
      }
  }
  // ✅ FIM DA CORREÇÃO

  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-amber-50 dark:bg-amber-950/50 rounded-lg border-2 border-dashed border-amber-500">
      <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
      <h3 className="text-xl font-bold">Solicitação Pendente</h3>
      <p className="text-muted-foreground mb-6">
        O operador <span className="font-semibold text-foreground">{operator}</span> solicitou o cancelamento do item <span className="font-semibold text-foreground">"{item}"</span> no valor de <span className="font-semibold text-foreground">{value.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'})}</span>.
      </p>
      <div className="flex gap-4">
        <Button variant="destructive" onClick={() => onResolve(alert, 'rejeitado')}>
          <X className="h-4 w-4 mr-2" /> Negar
        </Button>
        <Button variant="success" onClick={() => onResolve(alert, 'aprovado')}>
          <Check className="h-4 w-4 mr-2" /> Autorizar
        </Button>
      </div>
    </div>
  );
}
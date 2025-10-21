// src/components/pdvs/PdvAlertPanel.jsx

"use client"

import { Button } from "@/components/ui/button"
import { AlertTriangle, Check, X } from "lucide-react"

export default function PdvAlertPanel({ alert, onResolve }) {
  if (!alert) {
    return null; // Não mostra nada se não houver alerta
  }

  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-amber-50 dark:bg-amber-950/50 rounded-lg border-2 border-dashed border-amber-500">
      <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
      <h3 className="text-xl font-bold">Solicitação Pendente</h3>
      <p className="text-muted-foreground mb-6">
        O operador <span className="font-semibold text-foreground">{alert.operator}</span> solicitou o cancelamento do item <span className="font-semibold text-foreground">"{alert.item}"</span> no valor de <span className="font-semibold text-foreground">{alert.value.toLocaleString('pt-BR', {style:'currency', currency: 'BRL'})}</span>.
      </p>
      <div className="flex gap-4">
        <Button variant="destructive" onClick={() => onResolve('negado')}>
          <X className="h-4 w-4 mr-2" /> Negar
        </Button>
        <Button variant="success" onClick={() => onResolve('aprovado')}>
          <Check className="h-4 w-4 mr-2" /> Autorizar
        </Button>
      </div>
    </div>
  );
}
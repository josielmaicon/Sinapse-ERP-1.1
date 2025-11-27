"use client"

import * as React from "react"
import { Kbd } from "@/components/ui/kbd"
import { Separator } from "@/components/ui/separator"
import { ScanLine } from "lucide-react"

const InfoField = ({ label, value, size = "text-3xl" }) => (
  <div className="bg-black/5 dark:bg-white/5 p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`font-bold tracking-tighter ${size}`}>{value}</p>
  </div>
)

const hotkeys = [
  { key: "F1", description: "Finalizar Venda" },
  { key: "F2", description: "Pesquisar Produto" },
  { key: "F3", description: "Identificar Cliente" },
  { key: "F4", description: "Aplicar Desconto" },
  { key: "ESC", description: "Cancelar Venda" },
  { key: "Alt+S", description: "Sair do PDV" },
]

export default function PosSidePanel({ lastItem }) {
  return (
    <div className="h-full w-full flex flex-col justify-between font-mono">
      {/* 🧭 SEÇÃO SUPERIOR */}
      <div className="flex flex-col gap-2 flex-1 justify-cetopnter">
        {!lastItem ? (
          // Estado "aguardando produto"
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full">
            <ScanLine className="h-16 w-16 mb-4" />
            <h3 className="font-semibold">Aguardando Produto</h3>
            <p className="text-sm">
              Passe o primeiro item no leitor de código de barras ou digite o código.
            </p>
          </div>
        ) : (
          // Estado com produto
          <div className="flex flex-col gap-2">
            <InfoField label="Produto" value={lastItem.name} />
            <InfoField label="Código de Barras" value={lastItem.id} size="text-2xl" />

            <div className="grid grid-cols-2 gap-2">
              <InfoField label="Qtd." value={lastItem.quantity} />
              <InfoField
                label="Valor Unit."
                value={lastItem.unitPrice.toLocaleString("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                })}
              />
            </div>

            <InfoField
              label="Valor Total"
              value={lastItem.totalPrice.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
              })}
            />
          </div>
        )}
      </div>

      {/* 🧭 SEÇÃO INFERIOR: atalhos fixos */}
      <div>
        <Separator className="my-4" />
        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
          Atalhos do Teclado
        </h4>
        <div className="flex flex-col gap-2">
          {hotkeys.map((hotkey) => (
            <div
              key={hotkey.key}
              className="flex justify-between items-center text-base"
            >
              <span>{hotkey.description}</span>
              <Kbd>{hotkey.key}</Kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

"use client"

import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { ArrowUpCircle, ArrowDownCircle, AlertCircle, Edit } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

// ------------------- MOCK -------------------
const logData = [
  { id: 1, date: new Date("2025-10-15T09:05:00"), type: "entrada", quantity: 100, user: "Josiel M.", note: "Pedido #582" },
  { id: 2, date: new Date("2025-10-15T11:30:00"), type: "saida-venda", quantity: -1, user: "Ana Paula", note: "Venda PDV 01" },
  { id: 3, date: new Date("2025-10-15T14:15:00"), type: "saida-venda", quantity: -2, user: "Carlos S.", note: "Venda PDV 02" },
  { id: 4, date: new Date("2025-10-14T18:00:00"), type: "ajuste", quantity: 2, user: "Josiel M.", note: "Correção de balanço" },
  { id: 5, date: new Date("2025-10-13T15:20:00"), type: "perda", quantity: -1, user: "Mariana L.", note: "Embalagem avariada" },
]

const logTypeDetails = {
  entrada: { text: "Entrada em estoque", color: "text-green-600", icon: ArrowUpCircle },
  "saida-venda": { text: "Saída por venda", color: "text-blue-600", icon: ArrowDownCircle },
  ajuste: { text: "Ajuste manual", color: "text-amber-500", icon: Edit },
  perda: { text: "Perda / avaria", color: "text-destructive", icon: AlertCircle },
}

// ------------------- SUBCOMPONENTE -------------------
const DetailRow = ({ label, value, className = "" }) => (
  <div className={`flex justify-between text-sm ${className}`}>
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value ?? "--"}</span>
  </div>
)

// ------------------- COMPONENTE PRINCIPAL -------------------
export default function ProductDetailPanel({ product }) {
  const isLoading = !product

  // Mesmo sem produto, os campos permanecem visíveis com placeholders
  const name = product?.nome ?? "Nome do Produto";
  const description = product?.descricao;
  const costPrice = product?.preco_custo?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "--";
  const salePrice = product?.preco_venda?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) ?? "--";
  const margin =
    product && product.preco_venda && product.preco_custo
      ? ((product.preco_venda - product.preco_custo) / product.preco_venda) * 100
      : null;
  const marginDisplay = margin !== null ? `${margin.toFixed(2)}%` : "--";

  const quantity = product?.quantidade_estoque ?? "--";
  const sku = product?.codigo_barras ?? "--"; // Usando 'codigo_barras'
  const category = product?.categoria ?? "--";
  const location = product?.localizacao ?? "--"; // 'localizacao' seria um bom campo para adicionar ao seu 'models.py'

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* --- BLOCO SUPERIOR (DETALHES) --- */}
      <div className="flex-shrink-0 flex flex-col gap-4">
        <div>
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        {/* Financeiro */}
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-md mb-1">Financeiro</h4>
          <DetailRow label="Preço de Custo" value={costPrice} />
          <DetailRow label="Preço de Venda" value={salePrice} />
          <DetailRow label="Margem" value={marginDisplay} />
        </div>

        <Separator />

        {/* Estoque */}
        <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-md mb-1">Estoque</h4>
          <DetailRow label="Quantidade Atual" value={quantity} />
          <DetailRow label="SKU" value={sku} />
          <DetailRow label="Categoria" value={category} />
          <DetailRow label="Localização" value={location} />
        </div>
      </div>

      {/* --- BLOCO INFERIOR (HISTÓRICO) --- */}
      <div className="flex-shrink-0 flex flex-col min-h-0 h-2/5">
        <Separator className="my-4" />
        <h4 className="font-semibold mb-2 flex-shrink-0">Histórico de Movimentações</h4>

        <div className="flex-grow overflow-y-auto pr-2">
          <div className="flex flex-col gap-6">
            {isLoading ? (
              // Skeletons apenas quando não há produto
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-5 w-5 rounded-full" />
                  <div className="flex flex-col gap-2 w-full">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-56" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
            ) : (
              logData.map((log) => {
                const details = logTypeDetails[log.type] || {}
                const Icon = details.icon || AlertCircle
                return (
                  <div key={log.id} className="flex items-start gap-4">
                    <Icon className={`mt-1 h-5 w-5 flex-shrink-0 ${details.color}`} />
                    <div className="flex flex-col">
                      <p className="font-medium">
                        <strong>{log.quantity > 0 ? `+${log.quantity}` : log.quantity} unidades</strong> ({details.text})
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(log.date, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })} por {log.user}
                      </p>
                      {log.note && (
                        <p className="text-xs text-muted-foreground italic">Obs: {log.note}</p>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

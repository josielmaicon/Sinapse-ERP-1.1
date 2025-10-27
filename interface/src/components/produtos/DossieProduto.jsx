// src/components/products/ProductDossier.jsx

import { Separator } from "@/components/ui/separator"

// Componente auxiliar para exibir linhas de detalhe
const DetailRow = ({ label, value, className = "" }) => (
  <div className={`flex justify-between text-sm ${className}`}>
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value ?? "--"}</span>
  </div>
)

export default function ProductDossier({ product }) {
  // Define os valores, usando fallback "--" quando não houver produto
  const name = product?.name ?? "--"
  const costPrice = product?.costPrice?.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  }) ?? "--"

  const salePrice = product?.salePrice?.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  }) ?? "--"

  const margin =
    product && product.salePrice && product.costPrice
      ? ((product.salePrice - product.costPrice) / product.salePrice) * 100
      : null

  const marginDisplay = margin !== null ? `${margin.toFixed(2)}%` : "--"

  const quantity = product?.quantity ?? "--"
  const sku = product?.id ?? "--"
  const category = product?.category ?? "--"
  const location = product?.location ?? "--"

  return (
    <div className="h-full flex flex-col gap-4 p-4">
      {/* Cabeçalho */}
      <div className="flex-shrink-0">
        <h3 className="text-lg font-semibold">{name}</h3>
        <p className="text-sm text-muted-foreground">Descrição do Produto</p>
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
  )
}

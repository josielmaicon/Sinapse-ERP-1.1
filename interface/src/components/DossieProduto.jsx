// src/components/products/ProductDossier.jsx

import { Separator } from "@/components/ui/separator"
import { PackageSearch } from "lucide-react"

// Helper para criar as linhas de detalhe
const DetailRow = ({ label, value, className = "" }) => (
  <div className={`flex justify-between text-sm ${className}`}>
    <span className="text-muted-foreground">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

export default function ProductDossier({ product }) {
  // Estado Padrão: quando nenhum produto está selecionado
  if (!product) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
        <PackageSearch className="h-12 w-12 mb-4" />
        <h3 className="font-semibold">Nenhum produto selecionado</h3>
        <p className="text-sm">Clique em um item na tabela para ver seus detalhes.</p>
      </div>
    );
  }

  // Calcula a margem
  const margin = product.salePrice && product.costPrice
    ? ((product.salePrice - product.costPrice) / product.salePrice) * 100
    : 0;

  return (
    <div className="h-full flex flex-col gap-4 p-4">

      <div className="flex-shrink-0">
        <h3 className="text-lg font-semibold">{product.name}</h3>
        <p className="text-sm text-muted-foreground">Descrição do Produto</p>
        <Separator className="my-4" />
      </div>

      <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-md mb-1">Financeiro</h4>
          <DetailRow label="Preço de Custo" value={product.costPrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'N/D'} />
          
          {/* ✅ CORREÇÃO AQUI: "pt--BR" foi trocado para "pt-BR" */}
          <DetailRow label="Preço de Venda" value={product.salePrice?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) ?? 'N/D'} />
          
          <DetailRow label="Margem" value={`${margin.toFixed(2)}%`} />
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
          <h4 className="font-semibold text-md mb-1">Estoque</h4>
          <DetailRow label="Quantidade Atual" value={product.quantity} />
          <DetailRow label="SKU" value={product.id} />
          <DetailRow label="Categoria" value={product.category} />
          <DetailRow label="Localização" value={product.location || "N/D"} />
      </div>
    </div>
  );
}
// Esse é o código da página:
import ProdutosPageLayout from "@/layouts/ProdutosPageLayout"; 
import { columns } from "@/components/Colunas";
import { ProductDataTable } from "@/components/TabelaProdutos";
import { Divide } from "lucide-react";

const productData = [
  { id: "PROD-001", name: "Leite Integral 1L", category: "Laticínios", quantity: 150, daysUntilExpiry: 15 },
  { id: "PROD-002", name: "Pão Francês", category: "Padaria", quantity: 80, daysUntilExpiry: 1 },
  { id: "PROD-003", name: "Coca-Cola 2L", category: "Bebidas", quantity: 200, daysUntilExpiry: 90 },
  { id: "PROD-004", name: "Detergente Ypê", category: "Limpeza", quantity: 95, daysUntilExpiry: 365 },
  { id: "PROD-005", name: "Iogurte Natural", category: "Laticínios", quantity: 40, daysUntilExpiry: 5 },
  { id: "PROD-006", name: "Tomate Kg", category: "Hortifruti", quantity: 25, daysUntilExpiry: -2 }, // Vencido
];


export default function ProtudosPage() {
  return (
    <ProdutosPageLayout
      TabelaProdutos={
        <div className="flex flex-col min-w-0 h-full">
          <ProductDataTable columns={columns} data={productData} />
        </div>}
    />
  );
}
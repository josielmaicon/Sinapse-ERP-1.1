import * as React from "react";
import ProdutosPageLayout from "@/layouts/ProdutosPageLayout"; 
import { columns } from "@/components/Colunas";
import { ProductDataTable } from "@/components/TabelaProdutos";
import ProductDossier from "@/components/DossieProduto";
import MovementLog from "@/components/Movimentacoes";
import { Divide } from "lucide-react";

const productData = [
  { id: "PROD-001", name: "Leite Integral 1L", category: "Laticínios", quantity: 150, daysUntilExpiry: 15, costPrice: 3.50, salePrice: 5.99, location: "Corredor 2, Prateleira 1" },
  { id: "PROD-002", name: "Pão Francês", category: "Padaria", quantity: 80, daysUntilExpiry: 1, costPrice: 0.40, salePrice: 0.80, location: "Padaria" },
  { id: "PROD-003", name: "Coca-Cola 2L", category: "Bebidas", quantity: 200, daysUntilExpiry: 90, costPrice: 7.00, salePrice: 9.50, location: "Corredor 5, Ponta" },
  { id: "PROD-004", name: "Detergente Ypê", category: "Limpeza", quantity: 95, daysUntilExpiry: 365, costPrice: 1.80, salePrice: 2.50, location: "Corredor 1, Prateleira 3" },
  { id: "PROD-005", name: "Iogurte Natural", category: "Laticínios", quantity: 40, daysUntilExpiry: 5, costPrice: 2.10, salePrice: 3.20, location: "Corredor 2, Prateleira 2" },
  { id: "PROD-006", name: "Tomate Kg", category: "Hortifruti", quantity: 25, daysUntilExpiry: -2, costPrice: 4.50, salePrice: 6.99, location: "Hortifruti" },
];

export default function ProtudosPage() {

  const [selectedProduct, setSelectedProduct] = React.useState(null);
  const [rowSelection, setRowSelection] = React.useState({});

  return (
    <ProdutosPageLayout
      TabelaProdutos={
        <div className="flex flex-col min-w-0 h-full">
           <ProductDataTable 
            columns={columns} 
            data={productData} 
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            onProductSelect={setSelectedProduct}
          />
        </div>}
      PainelLateral1={<ProductDossier product={selectedProduct} />}
      PainelLateral2={<div><MovementLog product={selectedProduct} /></div>}
    />
  
  );
}
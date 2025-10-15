import * as React from "react";
import ProdutosPageLayout from "@/layouts/ProdutosPageLayout"; 
import { columns } from "@/components/Colunas";
import { ProductDataTable } from "@/components/TabelaProdutos";
import ProductDossier from "@/components/DossieProduto";
import MovementLog from "@/components/Movimentacoes";
import { Divide } from "lucide-react";
import MiniChart from "@/components/MiniChart";

const productData = [
  { id: "PROD-001", name: "Leite Integral 1L", category: "Laticínios", quantity: 150, daysUntilExpiry: 15, costPrice: 3.50, salePrice: 5.99, location: "Corredor 2, Prateleira 1" },
  { id: "PROD-002", name: "Pão Francês", category: "Padaria", quantity: 80, daysUntilExpiry: 1, costPrice: 0.40, salePrice: 0.80, location: "Padaria" },
  { id: "PROD-003", name: "Coca-Cola 2L", category: "Bebidas", quantity: 200, daysUntilExpiry: 90, costPrice: 7.00, salePrice: 9.50, location: "Corredor 5, Ponta" },
  { id: "PROD-004", name: "Detergente Ypê", category: "Limpeza", quantity: 95, daysUntilExpiry: 365, costPrice: 1.80, salePrice: 2.50, location: "Corredor 1, Prateleira 3" },
  { id: "PROD-005", name: "Iogurte Natural", category: "Laticínios", quantity: 40, daysUntilExpiry: 5, costPrice: 2.10, salePrice: 3.20, location: "Corredor 2, Prateleira 2" },
  { id: "PROD-006", name: "Tomate Kg", category: "Hortifruti", quantity: 25, daysUntilExpiry: -2, costPrice: 4.50, salePrice: 6.99, location: "Hortifruti" },
  { id: "PROD-007", name: "Arroz Tipo 1 5Kg", category: "Mercearia", quantity: 110, daysUntilExpiry: 365, costPrice: 19.90, salePrice: 28.90, location: "Corredor 3, Prateleira 1" },
  { id: "PROD-008", name: "Feijão Carioca 1Kg", category: "Mercearia", quantity: 95, daysUntilExpiry: 365, costPrice: 6.50, salePrice: 9.90, location: "Corredor 3, Prateleira 2" },
  { id: "PROD-009", name: "Macarrão Espaguete 500g", category: "Mercearia", quantity: 120, daysUntilExpiry: 540, costPrice: 3.00, salePrice: 4.90, location: "Corredor 3, Prateleira 3" },
  { id: "PROD-010", name: "Molho de Tomate Tradicional 340g", category: "Mercearia", quantity: 80, daysUntilExpiry: 240, costPrice: 2.20, salePrice: 3.80, location: "Corredor 3, Prateleira 4" },
  { id: "PROD-011", name: "Açúcar Refinado 1Kg", category: "Mercearia", quantity: 150, daysUntilExpiry: 730, costPrice: 3.10, salePrice: 5.20, location: "Corredor 3, Prateleira 5" },
  { id: "PROD-012", name: "Café Torrado e Moído 500g", category: "Mercearia", quantity: 70, daysUntilExpiry: 540, costPrice: 9.90, salePrice: 14.90, location: "Corredor 3, Prateleira 6" },
  { id: "PROD-013", name: "Sabão em Pó 1Kg", category: "Limpeza", quantity: 60, daysUntilExpiry: 730, costPrice: 7.50, salePrice: 11.90, location: "Corredor 1, Prateleira 2" },
  { id: "PROD-014", name: "Amaciante Comfort 2L", category: "Limpeza", quantity: 40, daysUntilExpiry: 730, costPrice: 10.90, salePrice: 16.90, location: "Corredor 1, Prateleira 1" },
  { id: "PROD-015", name: "Desinfetante Pinho Sol 500ml", category: "Limpeza", quantity: 85, daysUntilExpiry: 720, costPrice: 4.50, salePrice: 6.99, location: "Corredor 1, Prateleira 4" },
  { id: "PROD-016", name: "Banana Nanica Kg", category: "Hortifruti", quantity: 35, daysUntilExpiry: 3, costPrice: 3.80, salePrice: 6.20, location: "Hortifruti" },
  { id: "PROD-017", name: "Maçã Gala Kg", category: "Hortifruti", quantity: 45, daysUntilExpiry: 7, costPrice: 5.50, salePrice: 8.99, location: "Hortifruti" },
  { id: "PROD-018", name: "Alface Crespa", category: "Hortifruti", quantity: 20, daysUntilExpiry: 2, costPrice: 1.80, salePrice: 3.50, location: "Hortifruti" },
  { id: "PROD-019", name: "Carne Bovina Acém Kg", category: "Açougue", quantity: 60, daysUntilExpiry: 10, costPrice: 22.90, salePrice: 32.90, location: "Açougue, Balcão 1" },
  { id: "PROD-020", name: "Frango Congelado Inteiro Kg", category: "Açougue", quantity: 75, daysUntilExpiry: 180, costPrice: 8.90, salePrice: 13.50, location: "Freezer 1" },
  { id: "PROD-021", name: "Peito de Frango Kg", category: "Açougue", quantity: 50, daysUntilExpiry: 25, costPrice: 12.90, salePrice: 19.90, location: "Freezer 2" },
  { id: "PROD-022", name: "Margarina 500g", category: "Laticínios", quantity: 90, daysUntilExpiry: 60, costPrice: 4.20, salePrice: 6.99, location: "Corredor 2, Prateleira 3" },
  { id: "PROD-023", name: "Queijo Mussarela Kg", category: "Laticínios", quantity: 40, daysUntilExpiry: 15, costPrice: 25.90, salePrice: 37.90, location: "Corredor 2, Frios" },
  { id: "PROD-024", name: "Presunto Cozido Kg", category: "Laticínios", quantity: 30, daysUntilExpiry: 12, costPrice: 21.90, salePrice: 33.90, location: "Corredor 2, Frios" },
  { id: "PROD-025", name: "Biscoito Recheado 140g", category: "Mercearia", quantity: 200, daysUntilExpiry: 365, costPrice: 1.80, salePrice: 3.20, location: "Corredor 4, Prateleira 1" },
  { id: "PROD-026", name: "Chocolate Barra 90g", category: "Mercearia", quantity: 100, daysUntilExpiry: 300, costPrice: 4.50, salePrice: 7.90, location: "Corredor 4, Ponta" },
  { id: "PROD-027", name: "Refrigerante Guaraná 2L", category: "Bebidas", quantity: 180, daysUntilExpiry: 120, costPrice: 6.50, salePrice: 8.99, location: "Corredor 5, Prateleira 2" },
  { id: "PROD-028", name: "Água Mineral 500ml", category: "Bebidas", quantity: 300, daysUntilExpiry: 720, costPrice: 0.80, salePrice: 1.50, location: "Corredor 5, Geladeira" },
  { id: "PROD-029", name: "Cerveja Pilsen Lata 350ml", category: "Bebidas", quantity: 220, daysUntilExpiry: 180, costPrice: 3.00, salePrice: 5.50, location: "Corredor 5, Geladeira" },
  { id: "PROD-030", name: "Vinho Tinto Seco 750ml", category: "Bebidas", quantity: 40, daysUntilExpiry: 1095, costPrice: 32.90, salePrice: 59.90, location: "Corredor 6, Bebidas Finas" },
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
      PainelLateral2={<MovementLog product={selectedProduct} />}
      Card1={<MiniChart/>}
      Card2={<MiniChart/>}
      Card3={<MiniChart/>}
      Card4={<MiniChart/>}
    />
  
  );
}
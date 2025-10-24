"use client"

import * as React from "react";
import ProdutosPageLayout from "@/layouts/ProdutosPageLayout"; 
import { columns } from "@/components/Colunas";
import { ProductDataTable } from "@/components/TabelaProdutos";
import ProductDetailPanel from "@/components/PainelDetalheProduto";
import MiniChart from "@/components/MiniChart";

export default function ProdutosPage() {
  const [productData, setProductData] = React.useState([]);
  const [selectedProduct, setSelectedProduct] = React.useState(null);

  const fetchProducts = async () => {
    try {
      console.log("Buscando produtos atualizados da API...");
      const response = await fetch('http://localhost:8000/api/produtos');
      if (!response.ok) {
        throw new Error('Falha ao buscar produtos');
      }
      const data = await response.json();
      setProductData(data);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  React.useEffect(() => {
    fetchProducts();
  }, []);

  const dashboardStats = React.useMemo(() => {
      if (!productData || productData.length === 0) {
        return { totalStockValue: 0, lowStockCount: 0, expiringSoonCount: 0 };
      }

      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

      return productData.reduce((stats, product) => {
          stats.totalStockValue += (product.preco_custo || 0) * (product.quantidade_estoque || 0);

          if ((product.quantidade_estoque || 0) <= (product.estoque_minimo || 5)) {
              stats.lowStockCount += 1;
          }

          const expiryDate = product.vencimento ? new Date(product.vencimento) : null;
          if (expiryDate && expiryDate <= sevenDaysFromNow && expiryDate >= new Date()) {
              stats.expiringSoonCount += 1;
          }
          
          return stats;
      }, { totalStockValue: 0, lowStockCount: 0, expiringSoonCount: 0 });
    }, [productData]);

  return (
    <ProdutosPageLayout
      TabelaProdutos={
        <div className="flex flex-col min-w-0 h-full">
           <ProductDataTable 
            columns={columns} 
            data={productData} 
            onProductSelect={setSelectedProduct}
            refetchData={fetchProducts}
          />
        </div>}
      PainelLateral={<ProductDetailPanel product={selectedProduct} />}
      Card1_MainValue={dashboardStats.totalStockValue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      Card1_Description="Valor Total de Estoque"
      Card1_Children={<MiniChart />}

      Card2_MainValue={dashboardStats.lowStockCount}
      Card2_Description="Itens com Estoque Baixo"
      Card2_Children={<MiniChart />}

      Card3_MainValue={dashboardStats.expiringSoonCount || 0}
      Card3_Description="Itens Próximos do Vencimento"
      Card3_Children={<MiniChart />}

      Card4_MainValue={0} // Placeholder
      Card4_Description="Itens Sem Giro"
      Card4_Children={<MiniChart />}
    />
  );
}
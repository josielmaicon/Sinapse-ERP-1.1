// src/pages/ProdutosPage.jsx

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
      Card1={<MiniChart/>}
      Card2={<MiniChart/>}
      Card3={<MiniChart/>}
      Card4={<MiniChart/>}
    />
  );
}
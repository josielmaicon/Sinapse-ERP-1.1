// src/pages/ProdutosPage.jsx

"use client"

import * as React from "react";
import ProdutosPageLayout from "@/layouts/ProdutosPageLayout"; 
import { columns } from "@/components/Colunas";
import { ProductDataTable } from "@/components/TabelaProdutos";
import ProductDetailPanel from "@/components/PainelDetalheProduto";
import MiniChart from "@/components/MiniChart";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

export default function ProdutosPage() {
  const [productData, setProductData] = React.useState([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [historyData, setHistoryData] = React.useState([]); 
  const [isLoading, setIsLoading] = React.useState(true);
  const [activePanelTab, setActivePanelTab] = React.useState("visualizar");

  const fetchPageData = async () => {
    setIsLoading(true);
    try {
      const [productsRes, historyRes] = await Promise.all([
        fetch('http://localhost:8000/api/produtos'),
        fetch('http://localhost:8000/api/produtos/stats-history?limit=7')
      ]);

      if (!productsRes.ok) throw new Error('Falha ao buscar produtos');
      if (!historyRes.ok) throw new Error('Falha ao buscar histórico de stats');

      const products = await productsRes.json();
      const history = await historyRes.json();

      setProductData(products);
      setHistoryData(history);
      
    } catch (error) {
      console.error("Erro ao buscar dados da página:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  React.useEffect(() => {
    fetchPageData();
  }, []);
  
  const currentStats = React.useMemo(() => {
    if (isLoading || historyData.length === 0) {
      return { 
        valor_total_estoque: 0, 
        itens_estoque_baixo: 0, 
        itens_vencimento_proximo: 0,
        itens_sem_giro: 0
      };
    }
    return historyData[historyData.length - 1]; 
  }, [historyData, isLoading]);

  const chartData = React.useMemo(() => {
    const formatData = (key) => 
      historyData.map(item => ({
        name: format(new Date(item.data), "dd/MM"),
        value: item[key]
      }));
    
    return {
      stockValue: formatData('valor_total_estoque'),
      lowStock: formatData('itens_estoque_baixo'),
      expiringSoon: formatData('itens_vencimento_proximo'),
      noStockTurn: formatData('itens_sem_giro'),
    }
  }, [historyData]);

  const loadingSpinner = <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;

  // ✅ CORREÇÃO APLICADA AQUI
  const selectedProducts = React.useMemo(() => {
    return Object.keys(rowSelection)
      // Converte a chave (string "0") para um número (0)
      .map(index => productData[parseInt(index, 10)]) 
      .filter(Boolean); // Remove qualquer 'undefined'
  }, [rowSelection, productData]);

  return (
    <ProdutosPageLayout
      TabelaProdutos={
        <div className="flex flex-col min-w-0 h-full">
           <ProductDataTable 
            columns={columns} 
            data={productData}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
            refetchData={fetchPageData}
            setActivePanelTab={setActivePanelTab}
          />
        </div>}
      PainelLateral={
        <ProductDetailPanel 
          selectedProducts={selectedProducts} 
          refetchData={fetchPageData} 
          activeTab={activePanelTab}
          onTabChange={setActivePanelTab} 
        />
      }

      Card1_MainValue={isLoading ? loadingSpinner : currentStats.valor_total_estoque.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      Card1_Description="Valor Total de Estoque"
      Card1_Children={<MiniChart data={chartData.stockValue} dataKey="value" />}

      Card2_MainValue={isLoading ? loadingSpinner : currentStats.itens_estoque_baixo}
      Card2_Description="Itens com Estoque Baixo"
      Card2_Children={<MiniChart data={chartData.lowStock} dataKey="value" />}

      Card3_MainValue={isLoading ? loadingSpinner : currentStats.itens_vencimento_proximo}
      Card3_Description="Itens Próximos do Vencimento"
      Card3_Children={<MiniChart data={chartData.expiringSoon} dataKey="value" />}

      Card4_MainValue={isLoading ? loadingSpinner : currentStats.itens_sem_giro}
      Card4_Description="Itens Sem Giro"
      Card4_Children={<MiniChart data={chartData.noStockTurn} dataKey="value" />}
    />
  );
}
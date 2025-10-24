"use client"

import * as React from "react";
import MetaEnvio from "@/components/MetaEnvio";
import FiscalPageLayout from "@/layouts/FiscalPageLayout";
import FiscalDataTable from "@/components/TabelaFiscal"
import { fiscalColumns } from "@/components/ColunasTabelaFiscal";
import FiscalSummaryChart from "@/components/AnaliseEnvioFiscal";

export default function FiscalPage() {

// ✅ 1. ESTADO CENTRALIZADO PARA TODOS OS DADOS DA PÁGINA
    const [summaryData, setSummaryData] = React.useState({
        total_comprado_mes: 0,
        total_emitido_mes: 0,
        resumo_diario: [],
        notas_rejeitadas: 0,
        pendentes_antigas: 0,
    });
    const [tableData, setTableData] = React.useState([]); // Novo estado para a tabela
    const [isLoading, setIsLoading] = React.useState(true);

    // ✅ 2. FUNÇÃO ÚNICA PARA BUSCAR TODOS OS DADOS
    const fetchData = async () => {
        setIsLoading(true);
        try {
            // Busca os dados do summary
            const summaryResponse = await fetch('http://localhost:8000/api/fiscal/summary');
            if (!summaryResponse.ok) throw new Error("Falha ao buscar resumo fiscal");
            const summary = await summaryResponse.json();
            setSummaryData(summary);
            
            // Busca os dados da tabela (lista de vendas)
            // Usamos a rota de Vendas que já criamos
            const tableResponse = await fetch('http://localhost:8000/vendas/'); 
            if (!tableResponse.ok) throw new Error("Falha ao buscar dados da tabela");
            const table = await tableResponse.json();
            setTableData(table);

        } catch (error) {
            console.error("Erro ao buscar dados fiscais:", error);
            // toast.error("Erro ao carregar dados", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ 3. CHAMA A FUNÇÃO QUANDO A PÁGINA CARREGA
        React.useEffect(() => {
            fetchData();
        }, []); // Array vazio garante que rode apenas uma vez

  return (
    <FiscalPageLayout
        MetaEnvio={
            <MetaEnvio 
                totalPurchased={summaryData.total_comprado_mes}
                totalIssued={summaryData.total_emitido_mes}
            />
        }
        TabelaFiscal={
            // ✅ 3. PASSA OS DADOS REAIS (do estado) PARA A TABELA
            <FiscalDataTable 
                columns={fiscalColumns} 
                data={tableData} // Em vez de 'fiscalData'
            />
        }
        HistoricoEnvio={
            <FiscalSummaryChart 
                dailyData={summaryData.resumo_diario}
                rejectedCount={summaryData.notas_rejeitadas}
                oldPendingCount={summaryData.pendentes_antigas}
                isLoading={isLoading}
            />
        }/>
    );
}
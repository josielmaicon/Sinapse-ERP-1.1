"use client"

import * as React from "react";
import MetaEnvio from "@/components/fiscal/MetaEnvio";
import FiscalPageLayout from "@/layouts/FiscalPageLayout";
import FiscalDataTable from "@/components/fiscal/TabelaFiscal"
import { fiscalColumns } from "@/components/fiscal/ColunasTabelaFiscal";
import FiscalSummaryChart from "@/components/fiscal/AnaliseEnvioFiscal";
import { toast } from "sonner";

export default function FiscalPage() {

    const [fiscalConfig, setFiscalConfig] = React.useState({
        strategy: 'coeficiente',
        goal_value: 2.1,
        autopilot_enabled: false,
    });
    const [isConfigLoading, setIsConfigLoading] = React.useState(true);

    const [summaryData, setSummaryData] = React.useState({
        total_comprado_mes: 0,
        total_emitido_mes: 0,
        resumo_diario: [],
        notas_rejeitadas: 0,
        pendentes_antigas: 0,
    });
    const [tableData, setTableData] = React.useState([]);
    const [isLoading, setIsLoading] = React.useState(true);

    const fetchData = async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        setIsConfigLoading(true);
        try {
            const [summaryRes, tableRes, configRes] = await Promise.all([
                fetch('http://localhost:8000/api/fiscal/summary'),
                fetch('http://localhost:8000/vendas/'),
                fetch('http://localhost:8000/api/fiscal/config') 
            ]);
        
            if (!summaryRes.ok) throw new Error("Falha ao buscar resumo fiscal");
            if (!tableRes.ok) throw new Error("Falha ao buscar dados da tabela");
            if (!configRes.ok) throw new Error("Falha ao buscar configuração fiscal");
        
            const summary = await summaryRes.json();
            const table = await tableRes.json();
            const config = await configRes.json();
        
            setSummaryData(summary);
            setTableData(table);
            setFiscalConfig(config);
        
        } catch (error) {
            console.error("Erro ao buscar dados fiscais:", error);
            toast.error("Erro ao carregar dados", { description: error.message });
        } finally {
            if (showLoading) setIsLoading(false);
            setIsConfigLoading(false);
        }
    };

    const handleConfigSave = async (newConfig) => {
        const apiPromise = fetch('http://localhost:8000/api/fiscal/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newConfig)
        })
        .then(async (response) => {
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.detail || "Erro ao salvar configuração.");
            }
            return result;
        });
    
        toast.promise(apiPromise, {
            loading: "Salvando configuração...",
            success: (savedConfig) => {
                setFiscalConfig(savedConfig);
                return "Configuração fiscal salva com sucesso!";
            },
            error: (err) => err.message,
        });
        return apiPromise; 
    };

    const handleEmitirMeta = async () => {
         const apiPromise = fetch('http://localhost:8000/api/fiscal/emitir-meta', {
             method: 'POST',
         })
         .then(async (response) => {
             const result = await response.json();
             if (!response.ok) {
                 throw new Error(result.detail || "Erro ao solicitar emissão.");
             }
             return result; 
         });

         toast.promise(apiPromise, {
             loading: "Processando solicitação para atingir meta...",
             success: (result) => {
                 fetchData(false);
                 return result.message;
             },
             error: (err) => err.message,
         });
    };

    React.useEffect(() => {
            fetchData();
        }, []);

  return (
    <FiscalPageLayout
        MetaEnvio={
            <MetaEnvio 
                totalPurchased={summaryData.total_comprado_mes}
                totalIssued={summaryData.total_emitido_mes}
                config={fiscalConfig}
                onConfigChange={setFiscalConfig}
                onConfigSave={handleConfigSave} 
                onEmitirMeta={handleEmitirMeta} 
                isLoading={isConfigLoading}
            />
        }
        TabelaFiscal={
            <FiscalDataTable 
                columns={fiscalColumns} 
                data={tableData}
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
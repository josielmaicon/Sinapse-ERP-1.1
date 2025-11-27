"use client"

import * as React from "react";
import MetaEnvio from "@/components/fiscal/MetaEnvio";
import FiscalPageLayout from "@/layouts/FiscalPageLayout";
import FiscalDataTable from "@/components/fiscal/TabelaFiscal"
import { fiscalColumns } from "@/components/fiscal/ColunasTabelaFiscal";
import FiscalSummaryChart from "@/components/fiscal/AnaliseEnvioFiscal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import NotaEntradaDataTable from "@/components/fiscal/TabelaEntrada";
import { notaEntradaColumns } from "@/components/fiscal/ColunasFiscalEntrada";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

const API_URL = "http://localhost:8000";

export default function FiscalPage() {

    const [fiscalConfig, setFiscalConfig] = React.useState({
        strategy: 'coeficiente',
        goal_value: 2.1,
        autopilot_enabled: false,
    });
    const [isConfigLoading, setIsConfigLoading] = React.useState(true);

    const [entradaData, setEntradaData] = React.useState([]);
    const [isEntradaLoading, setIsEntradaLoading] = React.useState(true); // Loading específico

    const [activeTab, setActiveTab] = React.useState("saida"); // 'saida' ou 'entrada'
    const [batchLoadingType, setBatchLoadingType] = React.useState(null);
    const [pendingBatchType, setPendingBatchType] = React.useState(null);
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
            setIsEntradaLoading(true); // ✅ Inicia loading da tabela de entrada
            try {
                // ✅ 3. BUSCA TUDO EM PARALELO (incluindo notas de entrada)
                const [summaryRes, tableRes, configRes, entradaRes] = await Promise.all([
                    fetch('http://localhost:8000/fiscal/summary'),
                    fetch('http://localhost:8000/vendas/'),
                    fetch('http://localhost:8000/fiscal/config'), 
                    fetch('http://localhost:8000/notas-fiscais-entrada/') // ✅ Busca notas de entrada
                ]);
            
                if (!summaryRes.ok) throw new Error("Falha ao buscar resumo fiscal");
                if (!tableRes.ok) throw new Error("Falha ao buscar dados da tabela de saída");
                if (!configRes.ok) throw new Error("Falha ao buscar configuração fiscal");
                if (!entradaRes.ok) throw new Error("Falha ao buscar notas de entrada"); // ✅ Verifica resposta
            
                const summary = await summaryRes.json();
                const tableSaida = await tableRes.json();
                const config = await configRes.json();
                const tableEntrada = await entradaRes.json(); // ✅ Pega dados de entrada
            
                setSummaryData(summary);
                setTableData(tableSaida); // Dados de Saída
                setFiscalConfig(config);
                setEntradaData(tableEntrada); // ✅ Guarda dados de Entrada
            
            } catch (error) {
                console.error("Erro ao buscar dados fiscais:", error);
                toast.error("Erro ao carregar dados", { description: error.message });
            } finally {
                if (showLoading) setIsLoading(false);
                setIsConfigLoading(false);
                setIsEntradaLoading(false); // ✅ Finaliza loading da entrada
            }
        };


    const handleConfigSave = async (newConfig) => {
        const apiPromise = fetch('http://localhost:8000/fiscal/config', {
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
         const apiPromise = fetch('http://localhost:8000/fiscal/emitir-meta', {
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

const requestBatchAction = (tipo) => {
        if (batchLoadingType) return; // Proteção contra clique duplo
        setPendingBatchType(tipo); // Isso abre o <AlertDialog> automaticamente
    };

    // 2. EXECUTOR: Chamado pelo botão "Confirmar" do AlertDialog
    const executeBatchAction = async () => {
        const tipo = pendingBatchType; // Recupera o tipo que estava pendente
        setPendingBatchType(null);     // Fecha o modal

        const labels = {
            'nao_geradas': "Gerar e Emitir Notas Faltantes",
            'pendentes': "Forçar Envio de Pendentes",
            'rejeitadas': "Retentar Rejeitadas"
        };

        setBatchLoadingType(tipo); // Ativa o spinner no botão correspondente
        
        try {
            // Chama a API
            const response = await fetch(`${API_URL}/fiscal/emitir/pendentes?tipo=${tipo}`, { 
                method: 'POST',
            });
            const result = await response.json();
            
            if (!response.ok) throw new Error(result.detail || "Erro no lote.");
            
            toast.success("Operação concluída!", { description: result.message });
            
            // Recarrega a tabela
            await fetchData(false); 

        } catch (err) {
            toast.error("Erro na operação", { description: err.message });
        } finally {
            setBatchLoadingType(null); // Desativa o spinner
        }
    };

    // Helper para o texto dinâmico do Modal
    const getDialogContent = () => {
        switch(pendingBatchType) {
            case 'nao_geradas': 
                return { title: "Gerar Notas Faltantes?", desc: "O sistema irá gerar e tentar transmitir notas para todas as vendas que ainda não possuem registro fiscal." };
            case 'pendentes': 
                return { title: "Forçar Envio?", desc: "O sistema tentará retransmitir todas as notas que pararam no status 'Pendente'." };
            case 'rejeitadas': 
                return { title: "Retentar Rejeitadas?", desc: "O sistema reenviará as notas rejeitadas. Certifique-se de que os dados cadastrais foram corrigidos." };
            default: return { title: "Confirmar?", desc: "Deseja prosseguir com esta ação em lote?" };
        }
    };

  return (
    <>
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
        MainContent={ 
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                <TabsList className="flex-shrink-0">
                    <TabsTrigger value="saida">Notas de Saída (Vendas)</TabsTrigger>
                    <TabsTrigger value="entrada">Notas de Entrada (Compras)</TabsTrigger>
                </TabsList>
                
                {/* Conteúdo da Aba Saída */}
                <TabsContent value="saida" className="flex-grow min-h-0"> 
                    {isLoading ? ( // Usa o loading geral ou da tabela específica?
                        <Skeleton className="w-full h-full" /> 
                    ) : (
                        <FiscalDataTable 
                            columns={fiscalColumns} 
                            data={tableData}
                            refetchData={fetchData}
                            fiscalConfig={fiscalConfig}
                            totalPurchased={summaryData.total_comprado_mes}
                            totalIssued={summaryData.total_emitido_mes} // ✅ ADICIONAR ESTA PROP
                            onEmitirMeta={handleEmitirMeta} // ✅ Passar a função do pai (se já não estiver)
                            onBatchAction={requestBatchAction} 
                            batchLoadingType={batchLoadingType}
                        />
                    )}
                </TabsContent>
                
                {/* Conteúdo da Aba Entrada */}
                <TabsContent value="entrada" className="flex-grow min-h-0">
                    {isEntradaLoading ? (
                         <Skeleton className="w-full h-full" />
                    ) : (
                        // ✅ RENDERIZA A NOVA TABELA
                        <NotaEntradaDataTable
                            columns={notaEntradaColumns} 
                            data={entradaData}
                            refetchData={fetchData} // Passa refetch para ações futuras
                        /> 
                    )}
                </TabsContent>
            </Tabs>
        }
        HistoricoEnvio={
            <FiscalSummaryChart 
                dailyData={summaryData.resumo_diario}
                rejectedCount={summaryData.notas_rejeitadas}
                oldPendingCount={summaryData.pendentes_antigas}
                isLoading={isLoading}
            />
        }/>
        <AlertDialog open={!!pendingBatchType} onOpenChange={(open) => !open && setPendingBatchType(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{getDialogContent().title}</AlertDialogTitle>
          <AlertDialogDescription>
            {getDialogContent().desc}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          {/* O botão Confirmar chama o Executor */}
          <AlertDialogAction onClick={executeBatchAction}>
              Confirmar Ação
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
    );
}
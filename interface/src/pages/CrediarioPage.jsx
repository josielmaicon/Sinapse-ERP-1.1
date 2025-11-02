// src/pages/CrediarioPage.jsx

"use client"

import * as React from "react";
import CrediarioPageLayout from "@/layouts/CrediarioPageLayout";
import { crediarioColumns } from "@/components/crediario/ColunasTabelaCrediario";
import { CrediarioDataTable } from "@/components/crediario/TabelaCrediario";
import ClientDetailPanel from "@/components/crediario/PainelCrediario";
import { Loader2 } from "lucide-react"; // Para um placeholder de loading

export default function CrediarioPage() {
    const [selectedClient, setSelectedClient] = React.useState(null);
    const [tableData, setTableData] = React.useState([]);
    const [summaryData, setSummaryData] = React.useState({
        total_a_receber: 0,
        total_inadimplente: 0,
        clientes_com_credito: 0
    });
    const [isLoading, setIsLoading] = React.useState(true);

const fetchData = async () => {
        setIsLoading(true);
        try {
            const [summaryRes, clientsRes] = await Promise.all([
                fetch('http://localhost:8000/crediario/summary'),
                fetch('http://localhost:8000/crediario/clientes')
            ]);
            
            if (!summaryRes.ok || !clientsRes.ok) {
                throw new Error("Falha ao buscar dados do crediário");
            }
            
            const summary = await summaryRes.json();
            const clients = await clientsRes.json(); // Nova lista de clientes
            
            setSummaryData(summary);
            setTableData(clients);
            
            if (selectedClient && selectedClient.id) {
                const updatedSelectedClient = clients.find(c => c.id === selectedClient.id);
                if (updatedSelectedClient) {
                    setSelectedClient(updatedSelectedClient);
                    console.log("Painel lateral sincronizado com dados atualizados.");
                } else {
                    setSelectedClient(null);
                }
            }
            
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    React.useEffect(() => {
        fetchData();
    }, []);

    // Placeholder para o loading
    const loadingSpinner = <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />;

    return (
        <CrediarioPageLayout
            // ✅ A página agora passa as props individuais
            Card1_MainValue={isLoading ? loadingSpinner : summaryData.total_a_receber.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            Card1_Description="Valor Total a Receber"
            
            Card2_MainValue={isLoading ? loadingSpinner : summaryData.total_inadimplente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            Card2_Description="Valor Inadimplente"
            
            Card3_MainValue={isLoading ? loadingSpinner : summaryData.clientes_com_credito}
            Card3_Description="Clientes com Crédito"
            
            // Os children (gráficos) podem ser adicionados no futuro
            // Card1_Children={<MiniChart />}

            TabelaCredito={
                <CrediarioDataTable 
                    columns={crediarioColumns} 
                    data={tableData} 
                    onClientSelect={setSelectedClient}
                />
            }
            PainelLateral1={
                <ClientDetailPanel client={selectedClient} refetchData={fetchData}/>
            }
        />
    );
}
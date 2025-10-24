"use client"

import * as React from "react";
import MetaEnvio from "@/components/MetaEnvio";
import FiscalPageLayout from "@/layouts/FiscalPageLayout";
import FiscalDataTable from "@/components/TabelaFiscal"
import { fiscalColumns } from "@/components/ColunasTabelaFiscal";
import FiscalSummaryChart from "@/components/AnaliseEnvioFiscal";

const fiscalData = [
    { id: "VENDA-001", nfNumber: null, saleDate: "2025-10-15T14:15:00", issueDate: null, status: "pendente", saleValue: 45.50 },
    { id: "VENDA-002", nfNumber: "NFe-12345", saleDate: "2025-10-14T10:30:00", issueDate: "2025-10-14T11:00:00", status: "emitida", saleValue: 150.00 },
    { id: "VENDA-003", nfNumber: null, saleDate: "2025-10-13T09:00:00", issueDate: null, status: "nao_declarar", saleValue: 12.00 },
    { id: "VENDA-004", nfNumber: null, saleDate: "2025-10-12T16:45:00", issueDate: null, status: "pendente", saleValue: 88.75 },
    { id: "VENDA-005", nfNumber: "NFe-12344", saleDate: "2025-10-11T11:20:00", issueDate: "2025-10-11T11:30:00", status: "cancelada", saleValue: 25.00 },
];

export default function FiscalPage() {

// ✅ 1. ESTADO PARA GUARDAR OS DADOS DO PAINEL
    const [summaryData, setSummaryData] = React.useState({
        total_comprado_mes: 0,
        total_emitido_mes: 0,
    });
    const [isLoading, setIsLoading] = React.useState(true);

    // ✅ 2. FUNÇÃO PARA BUSCAR OS DADOS DA API
    const fetchSummary = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('http://localhost:8000/api/fiscal/summary');
            if (!response.ok) {
                throw new Error("Falha ao buscar resumo fiscal");
            }
            const data = await response.json();
            setSummaryData(data);
        } catch (error) {
            console.error("Erro no resumo fiscal:", error);
            // Aqui você poderia usar um toast.error
        } finally {
            setIsLoading(false);
        }
    };

    // ✅ 3. CHAMA A FUNÇÃO QUANDO A PÁGINA CARREGA
    React.useEffect(() => {
        fetchSummary();
    }, []); // Array vazio garante que rode apenas uma vez

  return (
    <FiscalPageLayout
        MetaEnvio={
            <MetaEnvio 
                totalPurchased={summaryData.total_comprado_mes}
                totalIssued={summaryData.total_emitido_mes}
            />
        }
        TabelaFiscal={<FiscalDataTable columns={fiscalColumns} data={fiscalData} />}
        HistoricoEnvio={<FiscalSummaryChart/>}
        />
  );
}
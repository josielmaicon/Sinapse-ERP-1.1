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
  return (
    <FiscalPageLayout
        MetaEnvio={<MetaEnvio/>}
        TabelaFiscal={<FiscalDataTable columns={fiscalColumns} data={fiscalData} />}
        HistoricoEnvio={<FiscalSummaryChart/>}
        />
  );
}
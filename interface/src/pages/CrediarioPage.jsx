import * as React from "react";
import CrediarioPageLayout from "@/layouts/CrediarioPageLayout";
import { crediarioColumns } from "@/components/ColunasTabelaCrediario";
import { CrediarioDataTable } from "@/components/TabelaCrediario";

const clientsData = [
  { id: "CLI-001", clientName: "José da Silva", clientCpf: "123.456.789-00", dueValue: 350.50, dueDate: "2025-10-15", status: "Atrasado", limitAvailable: 149.50 },
  { id: "CLI-002", clientName: "Maria Oliveira", clientCpf: "987.654.321-00", dueValue: 120.00, dueDate: "2025-11-10", status: "Em Dia", limitAvailable: 880.00 },
  { id: "CLI-003", clientName: "Carlos Pereira", clientCpf: "111.222.333-44", dueValue: 850.00, dueDate: "2025-11-05", status: "Em Dia", limitAvailable: 150.00 },
];

export default function CrediarioPage() {

  const [selectedClient, setSelectedClient] = React.useState(null);
  
  return (
    <CrediarioPageLayout
      TabelaCredito={
        <CrediarioDataTable 
                        columns={crediarioColumns} 
                        data={clientsData} 
                        onClientSelect={setSelectedClient}             
        />
      }
    />
  );
}
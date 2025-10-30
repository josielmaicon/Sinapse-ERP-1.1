"use client"

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react"; // ✅ Importar Loader

const statusDetails = {
    livre: { text: "Caixa Livre", className: "text-green-600" },
    em_andamento: { text: "Compra em Andamento", className: "text-blue-600" },
    // ✅ Novo status "digitando"
    typing: { text: "...", className: "text-muted-foreground" }, // O texto será substituído
    // ✅ Novo status "carregando"
    loading: { text: "Buscando...", className: "text-blue-600" },
    pagamento: { text: "Aguardando Pagamento", className: "text-yellow-500" },
    gaveta_aberta: { text: "ATENÇÃO: Gaveta Aberta", className: "text-red-600 animate-pulse" },
    bloqueado: { text: "Caixa Bloqueado", className: "text-gray-700" },
};

// ✅ Recebe 'status' e o novo 'buffer'
export default function PosFooterStatus({ status = "livre", buffer = "" }) {
    const currentStatus = statusDetails[status] || statusDetails.bloqueado;

    let displayText = currentStatus.text;
    let showLoader = status === 'loading';

    // ✅ Lógica da sua ideia: Se estiver digitando (ou livre com buffer), mostra o buffer!
    if ((status === 'typing' || (status === 'livre' && buffer.length > 0))) {
        displayText = buffer || "..."; // Mostra o buffer ou "..."
    }

    return (
        <div
            className={cn(
                "w-full h-full flex items-center justify-center rounded-xl",
                "text-6xl font-bold tracking-wider font-mono transition-colors",
                currentStatus.className
            )}
        >
            {showLoader && <Loader2 className="mr-4 h-12 w-12 animate-spin" />}
            {displayText}
            {/* Opcional: Adiciona um cursor piscando */}
            {(status === 'typing' || (status === 'livre' && buffer.length > 0)) && (
                <span className="animate-pulse">_</span>
            )}
        </div>
    );
}
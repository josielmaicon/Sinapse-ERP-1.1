// src/components/pos/PosFooterStatus.jsx

"use client"

import { cn } from "@/lib/utils";

// ✅ 1. MAPEAMENTO DE ESTADOS PARA ESTILOS
// Um objeto para organizar o texto e as classes de cada estado.
// Facilita a manutenção e deixa o código JSX mais limpo.
const statusDetails = {
    livre: {
        text: "Caixa Livre",
        className: "text-green-600",
    },
    em_andamento: {
        text: "Compra em Andamento",
        className: "text-blue-600",
    },
    pagamento: {
        text: "Aguardando Pagamento",
        className: "text-yellow-500",
    },
    gaveta_aberta: {
        text: "ATENÇÃO: Gaveta Aberta",
        className: "text-red-600 animate-pulse", // Efeito de pulsar para alertas
    },
    bloqueado: {
        text: "Caixa Bloqueado - Digite a Senha",
        className: "text-gray-700",
    },
};

export default function PosFooterStatus({ status = "livre" }) {
    // Busca os detalhes do status atual, com um fallback para 'bloqueado' se o status for desconhecido
    const currentStatus = statusDetails[status] || statusDetails.bloqueado;

    return (
        // ✅ 2. RENDERIZAÇÃO DINÂMICA
        // O componente aplica a classe e o texto correspondentes ao status recebido
        <div
            className={cn(
                "w-full h-full flex items-center justify-center rounded-xl",
                "text-6xl font-bold tracking-wider font-mono transition-colors",
                currentStatus.className // Aplica as classes de cor dinamicamente
            )}
        >
            {currentStatus.text}
        </div>
    );
}
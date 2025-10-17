"use client"

import * as React from "react";

// 🧩 MOCK: Dados simulados para a lista de itens da venda.
// No mundo real, esta lista viria de um estado gerenciado pela página.
const mockItems = [
    { id: 1, name: "Leite Integral 1L", quantity: 2, unitPrice: 5.99, totalPrice: 11.98 },
    { id: 2, name: "Pão Francês", quantity: 5, unitPrice: 0.80, totalPrice: 4.00 },
    { id: 3, name: "Coca-Cola 2L", quantity: 1, unitPrice: 9.50, totalPrice: 9.50 },
    { id: 4, name: "Detergente Ypê 500ml", quantity: 3, unitPrice: 2.50, totalPrice: 7.50 },
    { id: 5, name: "Iogurte Natural Grego", quantity: 2, unitPrice: 3.20, totalPrice: 6.40 },
    { id: 6, name: "Tomate Italiano Kg", quantity: 0.85, unitPrice: 6.99, totalPrice: 5.94 },
    { id: 7, name: "Sabão em Pó OMO Lavagem Perfeita", quantity: 1, unitPrice: 25.00, totalPrice: 25.00 },
    { id: 8, name: "Queijo Minas Frescal 500g", quantity: 1, unitPrice: 18.50, totalPrice: 18.50 },
    // Adicione mais itens aqui para testar o scroll
];

export default function SaleItemsList({ items = mockItems }) {
    return (
        // ✅ 1. FONTE GRANDE e CONTAINER DE SCROLL
        // 'font-mono' herdado, 'text-lg' para aumentar a fonte.
        // 'overflow-y-auto' cria o scroll vertical quando o conteúdo for maior que a altura.
        <div className="h-full w-full text-3xl overflow-y-auto bg-background rounded-md">
            <table className="w-full border-collapse">
                {/* ✅ 2. CABEÇALHO FIXO */}
                <thead className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm">
                    <tr>
                        {/* Usamos 'th' para o cabeçalho, semanticamente correto */}
                        <th className="p-3 text-left font-semibold text-muted-foreground w-1/2">Produto</th>
                        <th className="p-3 text-center font-semibold text-muted-foreground w-1/4">Qtd.</th>
                        <th className="p-3 text-right font-semibold text-muted-foreground w-1/4">Total</th>
                    </tr>
                </thead>
                
                {/* ✅ 3. LINHAS ALTERNADAS (ZEBRA STRIPING) */}
                <tbody className="[&>tr:nth-child(even)]:bg-black/5 dark:[&>tr:nth-child(even)]:bg-white/5">
                    {items.map((item) => (
                        <tr key={item.id} className="border-b border-border/50">
                            <td className="p-3 font-medium">{item.name}</td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-right font-semibold">
                                {item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
"use client"

import * as React from "react";

export default function SaleItemsList({ items = mockItems }) {
    return (
        <div className="h-full w-full text-base overflow-y-auto bg-background rounded-md">
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
                <tbody className="leading-tight [&>tr:nth-child(even)]:bg-black/5 dark:[&>tr:nth-child(even)]:bg-white/5">
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
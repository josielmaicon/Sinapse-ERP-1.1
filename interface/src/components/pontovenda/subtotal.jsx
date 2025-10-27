// src/components/pos/SaleResume.jsx

"use client"

import * as React from "react"

export default function SaleResume({ items = [] }) {
  // A lógica de cálculo continua aqui, para ser precisa
  const total = React.useMemo(() => {
    if (!items || items.length === 0) {
      return 0;
    }

    const subtotal = items.reduce((acc, item) => acc + item.totalPrice, 0);
    const discounts = 0; // Placeholder para descontos futuros
    
    return subtotal - discounts;
  }, [items]);

  return (
    // Usamos flex para centralizar o conteúdo vertical e horizontalmente
    <div className="w-full h-full flex flex-col justify-center items-end p-6 font-mono">
      
      {/* Rótulo "TOTAL" */}
      <p className="text-lg font-medium text-muted-foreground">
        TOTAL
      </p>
      
      {/* Valor Total com máximo destaque */}
      <p className="text-7xl font-bold tracking-tighter text-right">
        {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
      </p>

    </div>
  );
}
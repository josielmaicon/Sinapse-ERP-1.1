export default function ComprasPageLayout({
  Header1,
  Header2,
  SidePanel,
  MainContent,
  Footer,
  Resume
}) {
  return (
    <div 
        className="w-full h-screen font-mono flex flex-col p-2 transition-colors duration-500 ease-in-out"
        style={{ backgroundColor: 'var(--brand-color, #0b5077)' }}
    >
      <div className="flex-1 flex flex-col overflow-hidden gap-2 rounded-2xl">
        <div className="grid grid-cols-[4fr_6fr] gap-2">
          <div className="bg-card p-4 flex items-center justify-center overflow-hidden rounded-xl">
            {Header1 || "[CABEÇALHO 1]"}
          </div>

          <div className="bg-card p-4 flex items-center justify-center overflow-hidden rounded-xl">
            {Header2 || "[CABEÇALHO 2]"}
          </div>
        </div>

        {/* --- CORPO PRINCIPAL: mantém as duas colunas (4fr / 6fr) --- */}
        <div className="flex-1 grid grid-cols-[4fr_6fr] gap-2 min-h-0">
          {/* Coluna Esquerda — Painel lateral, dentro do seu próprio card */}
          <div className="bg-card p-4 flex flex-col overflow-auto min-h-0 rounded-xl">
            {SidePanel || "[PAINEL LATERAL]"}
          </div>

          {/* Coluna Direita — Conteúdo principal (lista rolável) + subtotal em card separado */}
          <div className="flex flex-col min-h-0 gap-2">
            {/* Card do conteúdo principal (rolável) */}
            <div className="bg-card p-4 flex-1 overflow-auto min-h-0 rounded-xl">
              {MainContent || "[CONTEÚDO PRINCIPAL]"}
            </div>

            {/* Card do subtotal — separado, alinhado só à coluna direita */}
            <div>
              <div className="bg-card p-4 rounded-xl">
                {Resume || "[SUBTOTAL]"}
              </div>
            </div>
          </div>
        </div>

        {/* --- RODAPÉ (ocupa a largura total abaixo das colunas) --- */}
        <div className="">
          <div className="bg-card p-4 flex items-center justify-center rounded-xl">
            {Footer || "[RODAPÉ]"}
          </div>
        </div>
      </div>
    </div>
  );
}

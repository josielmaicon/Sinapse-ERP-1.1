export default function ComprasPageLayout({
  Header1,
  Header2,
  SidePanel,
  MainContent,
  Footer,
  Resume
}) {
  return (
    // h-screen garante ocupar a viewport; flex-col para usar flex-1 corretamente
    <div className="w-full h-screen bg-[#0b5077] font-mono flex flex-col p-2 gap-2">
      {/* grid principal com 3 linhas: header / content / footer */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Cabeçalhos (altura automática) */}
        <div className="grid grid-cols-[4fr_6fr] gap-2">
          <div className="bg-card p-4 flex items-center justify-center overflow-hidden">
            {Header1 || "[CABEÇALHO 1]"}
          </div>
          <div className="bg-card p-4 flex items-center justify-center overflow-hidden">
            {Header2 || "[CABEÇALHO 2]"}
          </div>
        </div>

        {/* Conteúdo central: ocupa o restante */}
        <div className="flex-1 grid grid-cols-[4fr_6fr] gap-2 min-h-0">
          {/* Painel lateral (fixo dentro do espaço) */}
          <div className="bg-card p-4 flex items-start justify-center overflow-auto min-h-0">
            {SidePanel || "[PAINEL LATERAL]"}
          </div>

          {/* Coluna principal: lista rolável e subtotal fixo embaixo */}
          <div className="flex flex-col min-h-0">
            <div className="bg-card p-4 flex-1 overflow-auto min-h-0">
              {/* A lista deve rolar aqui se exceder */}
              {MainContent || "[CONTEÚDO PRINCIPAL]"}
            </div>
            <div className="bg-card p-4">
              {Resume || "[SUBTOTAL]"}
            </div>
          </div>
        </div>

        {/* Rodapé */}
        <div className="mt-2">
          <div className="bg-card p-4 flex items-center justify-center">
            {Footer || "[RODAPÉ]"}
          </div>
        </div>
      </div>
    </div>
  );
}

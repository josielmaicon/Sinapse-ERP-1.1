// src/layouts/ComprasPageLayout.jsx

export default function ComprasPageLayout({
  Header1,
  Header2,
  SidePanel,
  MainContent,
  Footer,
  Resume
}) {
  return (
    <div className="font-mono flex-1 p-2 pt-4 flex flex-col h-full bg-muted">
      <div className="grid flex-grow grid-rows-[0.2fr_1fr_0.2fr] gap-2 h-full min-h-0">
        <div className="grid flex-grow grid-cols-[4fr_6fr] gap-2 h-full min-h-0">
          <div className="bg-card p-4 flex items-center justify-center">
            {Header1 || "[CABEÇALHO 1]"}
          </div>
          <div className="bg-card  p-4 flex items-center justify-center">
            {Header2 || "[CABEÇALHO 2]"}
          </div>
        </div>

        <div className="grid grid-cols-[4fr_6fr] gap-2 min-h-0">
          
          <div className="grid grid-rows-1 gap-2 min-h-0">
            <div className="bg-card p-4 flex items-center justify-center">
              {SidePanel || "[PAINEL LATERAL]"}
            </div>
          </div>

          <div className="grid grid-rows-[6fr_1fr] gap-2 min-h-0">
            <div className="bg-card p-4 flex items-center justify-center">
              {MainContent || "[CONTEÚDO PRINCIPAL]"}
            </div>
            <div className="bg-card p-4 flex items-center justify-center">
              {Resume || "[SUBTOTAL]"}
            </div>
          </div>

          
        </div>

        <div className="bg-card p-4 flex items-center justify-center">
          {Footer || "[RODAPÉ]"}
        </div>

      </div>
    </div>
  );
}

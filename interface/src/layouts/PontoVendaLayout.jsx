// src/layouts/ComprasPageLayout.jsx

export default function ComprasPageLayout({
  Header,
  SidePanelTop,
  SidePanelBottom,
  MainContent,
  Footer,
}) {
  return (
    <div className="flex-1 p-2 pt-4 flex flex-col h-full">
      <div className="grid flex-grow grid-rows-[0.2fr_1fr_0.2fr] gap-2 h-full min-h-0">
        <div className="bg-card rounded-xl border p-4 flex items-center justify-center">
          {Header || "[CABEÇALHO]"}
        </div>
        <div className="grid grid-cols-[  4fr_6fr] gap-2 min-h-0">
          <div className="grid grid-rows-2 gap-2 min-h-0">
            <div className="bg-card rounded-xl border p-4 flex items-center justify-center">
              {SidePanelTop || "[PAINEL LATERAL - TOPO]"}
            </div>
            <div className="bg-card rounded-xl border p-4 flex items-center justify-center">
              {SidePanelBottom || "[PAINEL LATERAL - BAIXO]"}
            </div>
          </div>
          <div className="bg-card rounded-xl border p-4 flex items-center justify-center">
            {MainContent || "[CONTEÚDO PRINCIPAL]"}
          </div>
        </div>
        <div className="bg-card rounded-xl border p-4 flex items-center justify-center">
          {Footer || "[RODAPÉ]"}
        </div>
      </div>
    </div>
  );
}
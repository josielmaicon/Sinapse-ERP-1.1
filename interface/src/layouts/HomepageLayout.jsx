import CardContainer from "@/components/CardContainer"

export default function HomePageLayout({
  TopRight,
  BottomLeft,
  BottomRight,
  SideTop,
  SideBottom,
}) {
  return (
    <div className="flex-1 p-2 pt-4 grid grid-cols-[0.6fr_0.4fr] gap-2 min-h-0">
      
      {/* Coluna da Esquerda */}
      <div className="grid grid-rows-[0.6fr_0.4fr] gap-2 min-h-0">
        <CardContainer title="Faturamento" subtitle="Geral">
          {TopRight}
        </CardContainer>

        <div className="grid grid-cols-2 gap-2 min-h-0">
          <CardContainer title="Gráfico 1" subtitle="Visão de desempenho">
            {BottomLeft}
          </CardContainer>
          <CardContainer title="Gráfico 2" subtitle="Comparativo regional">
            {BottomRight}
          </CardContainer>
        </div>
      </div>

      {/* Coluna da Direita (AGORA CORRETA E SIMPLES) */}
      <div className="grid grid-rows-2 gap-2 min-h-0">
        {/* O CardContainer agora é robusto o suficiente para ser um filho direto do grid */}
        <CardContainer title="Resumo Diário" subtitle="Operação Por Operador">
          {SideTop}
        </CardContainer>
        
        <CardContainer title="Status Operações" subtitle="Status por Unidade Federativa">
          {SideBottom}
        </CardContainer>
      </div>

    </div>
  )
}
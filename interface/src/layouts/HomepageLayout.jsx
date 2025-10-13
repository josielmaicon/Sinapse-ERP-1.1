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
        <CardContainer title="Faturamento" subtitle="Visão Geral Mês/Dia">
          {TopRight}
        </CardContainer>

        <div className="grid grid-cols-1 gap-2 min-h-0">
          <CardContainer title="Perdas" subtitle="Níveis de atenção">
            {BottomLeft}
          </CardContainer>
        </div>
      </div>

      {/* Coluna da Direita (AGORA CORRETA E SIMPLES) */}
      <div className="grid grid-rows-2 gap-2 min-h-0">
        {/* O CardContainer agora é robusto o suficiente para ser um filho direto do grid */}
        <CardContainer title="Pontos de Venda" subtitle="Visão geral">
          {SideTop}
        </CardContainer>
        
        <CardContainer title="Mais Vendidos" subtitle="Ranking do período atual">
          {SideBottom}
        </CardContainer>
      </div>

    </div>
  )
}
import CardContainer from "@/components/CardContainer"

export default function HomePageLayout({
  TopRight,
  BottomLeft,
  BottomRight,
  SideTop,
  SideBottom,
}) {
  return (
    <div className="flex-1 p-2 pt-4 flex flex-col">
      <div className="flex-grow grid grid-cols-[0.6fr_0.4fr] gap-2">
        <div className="grid grid-rows-[0.6fr_0.4fr] gap-2">
          <CardContainer
            title="Faturamento"
            subtitle="Geral"
          >
            {TopRight}
          </CardContainer>

          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <CardContainer title="Gráfico 1" subtitle="Visão de desempenho">
              {BottomLeft}
            </CardContainer>

            <CardContainer title="Gráfico 2" subtitle="Comparativo regional">
              {BottomRight}
            </CardContainer>
          </div>
        </div>

        <div className="grid grid-rows-[1fr_1fr] gap-2">
          <CardContainer title="Resumo Diário" subtitle="Operação Por Operador">
            {SideTop}
          </CardContainer>

          <CardContainer title="Status Operações" subtitle="Status por Unidade Federativa">
            {SideBottom}
          </CardContainer>
        </div>
      </div>
    </div>
  )
}

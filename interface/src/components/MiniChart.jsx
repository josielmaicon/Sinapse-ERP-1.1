// src/components/common/StatsChart.jsx

"use client"

import { Line, LineChart } from "recharts"
import { ChartContainer } from "@/components/ui/chart"

// 🧩 MOCK DE DADOS (PARA TESTE):
// No seu uso real, você passará 'data' como prop.
const defaultChartData = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 300 },
  { name: "Mar", value: 600 },
  { name: "Apr", value: 800 },
  { name: "May", value: 700 },
  { name: "Jun", value: 900 },
];

const defaultChartConfig = {
  value: {
    label: "Valor",
    color: "hsl(var(--chart-1))", // Cor padrão, ajustável via prop
  },
}

export default function MiniChart({ 
  data = defaultChartData, 
  dataKey = "value", 
  lineColor = "var(--color-primary)", // Cor da linha, padrão para primary do shadcn
  fillColor = "hsl(var(--primary) / 0.1)", // Cor da área preenchida abaixo da linha
  chartConfig = defaultChartConfig,
  height = 100, // Altura padrão do gráfico, pode ser sobrescrita
}) {
  return (
    <ChartContainer config={chartConfig} className="w-full" style={{ height: `${height}px` }}>
      <LineChart
        accessibilityLayer
        data={data}
        margin={{
          top: 0,    // Sem margens
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {/* ✅ REMOVIDO: CartesianGrid */}
        {/* ✅ REMOVIDO: ChartTooltip */}
        
        <Line
          dataKey={dataKey}
          type="linear" // Curva suave
          stroke={lineColor}
          strokeWidth={2}
          activeDot={true} // Desabilita o dot ativo ao passar o mouse
          dot={true}       // Remove todos os dots estáticos
          fill={fillColor}  // Preenche a área abaixo da linha
        />
      </LineChart>
    </ChartContainer>
  )
}
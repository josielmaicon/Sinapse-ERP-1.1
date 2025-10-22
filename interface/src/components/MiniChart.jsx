// src/components/common/StatsChart.jsx

"use client"

import { Line, LineChart, ResponsiveContainer } from "recharts"
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
  fillColor = "var(--color-primary)", // Cor da área preenchida abaixo da linha
  chartConfig = defaultChartConfig,
}) {
  return (
  <ResponsiveContainer width="100%" height="100%">
    <ChartContainer config={chartConfig} className="w-full h-full pt-3">
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
        <Line
          dataKey={dataKey}
          type="natural" // Curva suave
          stroke={lineColor}
          strokeWidth={2}
          activeDot={true}
          dot={false}      
          fill={fillColor}
        />
      </LineChart>
    </ChartContainer>
  </ResponsiveContainer>
  )
}
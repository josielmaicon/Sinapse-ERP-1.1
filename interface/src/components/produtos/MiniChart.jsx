// src/components/common/StatsChart.jsx

"use client"

import { Area, AreaChart } from "recharts"
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
    <ChartContainer config={chartConfig} className="w-full h-full">
          <AreaChart
            accessibilityLayer
            data={data}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            {/* ✅ 3. Adicionado um gradiente para o preenchimento */}
            <defs>
                <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={lineColor} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={lineColor} stopOpacity={0.1}/>
                </linearGradient>
            </defs>
            
            <Area
              dataKey={dataKey}
              type="monotone"
              stroke={lineColor}
              strokeWidth={2}
              fill="url(#fillGradient)" // Usa o gradiente definido acima
              dot={false}
              activeDot={{ r: 4 }} // Mostra um ponto maior ao passar o mouse
            />
          </AreaChart>
        </ChartContainer>
      )
    }
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, XAxis, LabelList } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"

import { Button } from "@/components/ui/button" // Shadcn button

// Mock de faturamento diário de um mês (30 dias)
const chartData = Array.from({ length: 30 }, (_, i) => ({
  day: `2024-10-${String(i + 1).padStart(2, "0")}`,
  desktop: Math.floor(Math.random() * 1000) + 500, // R$ 500 a 1500
  mobile: Math.floor(Math.random() * 800) + 200,  // R$ 200 a 1000
}))

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
}

export default function SimpleBarChart() {
  const [activeChart, setActiveChart] = React.useState("desktop")

  return (
    <div className="flex flex-col">

      {/* Botões de alternância */}
      <div className="flex gap-2 mt-4">
        {["desktop", "mobile"].map((key) => (
          <Button
            key={key}
            variant={activeChart === key ? "default" : "outline"}
            onClick={() => setActiveChart(key)}
          >
            {chartConfig[key].label}
          </Button>
        ))}
      </div>
    
      {/* Gráfico */}
      <ChartContainer config={chartConfig} className="min-h-[400px] w-full">
        <BarChart
          accessibilityLayer
          data={chartData}
          margin={{ top: 16, right: 16, left: 12, bottom: 16 }}
        >
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            tickFormatter={(value) => value.slice(8)} // mostra só o dia
          />

          {/* Tooltip customizado */}
          <ChartTooltip content={<ChartTooltipContent />} />

          {/* Legenda customizada */}
          <ChartLegend content={<ChartLegendContent />} />

          {/* Barras */}
          <Bar dataKey={activeChart} fill={chartConfig[activeChart].color} radius={3}>
            <LabelList dataKey={activeChart} position="top" />
          </Bar>
        </BarChart>
      </ChartContainer>

    </div>
  )
}

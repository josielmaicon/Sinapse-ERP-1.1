"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { hour: "00:00", revenue: 1200 },
  { hour: "02:00", revenue: 800 },
  { hour: "04:00", revenue: 1500 },
  { hour: "06:00", revenue: 2500 },
  { hour: "08:00", revenue: 3200 },
  { hour: "10:00", revenue: 5000 },
  { hour: "12:00", revenue: 6500 },
  { hour: "14:00", revenue: 7000 },
  { hour: "16:00", revenue: 6200 },
  { hour: "18:00", revenue: 4800 },
  { hour: "20:00", revenue: 3500 },
  { hour: "22:00", revenue: 1800 },
]

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

import React from "react"


// Configuração do gráfico: define a cor como uma das paletas padrão do tema shadcn
const chartConfig = {
  revenue: {
    label: "Faturamento (R$)",
    color: "var(--chart-1)",
  },
}

export default function HourlyRevenueChart() {
  const [timeRange, setTimeRange] = React.useState("today") // ✅ define timeRange

  return (  
        <div className="w-full h-full flex flex-col">
      {/* Header com o seletor de período, sem título */}
      <div className="flex items-center justify-end p-4 pb-0">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            className="w-[160px] h-9"
            aria-label="Selecionar período"
          >
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="yesterday">Ontem</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
        
        <ChartContainer config={chartConfig} className="min-h-0 w-full">
        <AreaChart
            data={chartData}
            margin={{
            top: 10,
            right: 10,
            left: -10,
            bottom: 0,
            }}
        >
            {/* Grade de fundo */}
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />

            {/* Eixo X */}
            <XAxis
            dataKey="revenue"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            minTickGap={24}
            />

            <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tickFormatter={(value) =>
                value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
            }
            />

            {/* Tooltip */}
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

            {/* Gradiente e linha da área */}
            <defs>
            <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
            </linearGradient>
            </defs>

            <Area
            dataKey="revenue"
            type="natural"
            fill="url(#fillRevenue)"
            stroke="var(--color-revenue)"
            strokeWidth={2}
            />
        </AreaChart>
        </ChartContainer>
    </div>
  )
}

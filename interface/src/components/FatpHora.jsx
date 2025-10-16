"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

// Configuração do gráfico: define a cor como uma das paletas padrão do tema shadcn
const chartConfig = {
  revenue: {
    label: "Faturamento (R$)",
    color: "hsl(var(--primary))",
  },
}

export default function HourlyRevenueChart({ pdv }) { // Recebe o PDV selecionado como prop
  const [timeRange, setTimeRange] = React.useState("today")

  // ✅ CORREÇÃO: Os dados do gráfico agora são gerados dinamicamente
  // com base no PDV selecionado, usando React.useMemo.
  const chartData = React.useMemo(() => {
    // Se nenhum PDV for selecionado, o gráfico fica vazio.
    if (!pdv) {
      return [];
    }
    
    // SIMULAÇÃO: Gera dados aleatórios baseados no ID do PDV para que o gráfico mude visualmente.
    // No mundo real, você usaria o pdv.id para buscar os dados reais de uma API.
    return Array.from({ length: 12 }, (_, i) => {
      const hour = i + 8;
      return {
        hour: `${String(hour).padStart(2, '0')}:00`,
        revenue: Math.floor(Math.random() * (300 - 50 + 1)) + 50 + (pdv.name.length * 20),
      }
    });
  }, [pdv, timeRange]); // A mágica da reatividade: este bloco roda de novo sempre que 'pdv' ou 'timeRange' muda.

  return ( 
    <div className="w-full h-full flex flex-col">
      <div className="flex-shrink-0 flex items-center justify-end p-4 pb-0">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] h-9" aria-label="Selecionar período">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="yesterday">Ontem</SelectItem>
            <SelectItem value="7d">Últimos 7 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="flex-grow w-full min-h-0">
        <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
          {/* O gráfico agora usa os dados dinâmicos da variável 'chartData' */}
          <AreaChart
            data={chartData}
            margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="hour"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) =>
                `R$ ${value / 1000}k`
              }
            />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.8} />
                <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.1} />
              </linearGradient>
            </defs>
              <Area
                dataKey="revenue"
                type="natural"
                fill="url(#fillRevenue)"
                stroke="var(--chart-1)"
                strokeWidth={2}
              />  
          </AreaChart>
        </ChartContainer>
      </div>
    </div>
  )
}
// src/components/FatpHora.jsx

"use client"

import * as React from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"

const chartConfig = {
  revenue: {
    label: "Faturamento (R$)",
    color: "hsl(var(--primary))",
  },
}

export default function HourlyRevenueChart({ pdv }) {
  const [timeRange, setTimeRange] = React.useState("today")
  
  // ✅ 1. NOVO ESTADO para os dados e loading
  const [chartData, setChartData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  
  // ✅ 2. SUBSTITUÍDO 'useMemo' por 'useEffect' para buscar dados
  React.useEffect(() => {
    // Se nenhum PDV estiver selecionado, não faz nada
    if (!pdv) {
      setChartData([]);
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`http://localhost:8000/pdvs/${pdv.id}/revenue?range=${timeRange}`);
        if (!response.ok) {
          throw new Error("Falha ao buscar dados do gráfico");
        }
        const data = await response.json();
        setChartData(data);
      } catch (error) {
        console.error(error);
        setChartData([]); // Limpa os dados em caso de erro
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [pdv, timeRange]); // Roda toda vez que o PDV ou o 'timeRange' mudar

  // ✅ 3. LÓGICA DINÂMICA para o Eixo X
  // Define qual chave usar no eixo X e como formatá-la
  const xAxisKey = timeRange === '7d' ? 'day' : 'hour';
  const xAxisFormatter = (value) => {
    if (timeRange === '7d') {
      try {
        // Formata 'AAAA-MM-DD' para 'DD/MM'
        const date = new Date(value);
        return format(date, "dd/MM");
      } catch (e) { return value; }
    }
    return value; // Retorna a hora (ex: "08:00")
  };

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
        {isLoading ? (
          <Skeleton className="w-full h-full" />
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
            <AreaChart
              data={chartData}
              margin={{ top: 20, right: 20, left: 10, bottom: 10 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                // ✅ 4. Eixo X agora é dinâmico
                dataKey={xAxisKey}
                tickFormatter={xAxisFormatter}
                tickLine={false}
                axisLine={false}
                tickMargin={8}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => `R$ ${value / 1000}k`}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <defs>
                <linearGradient id="fillGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <Area
                dataKey="revenue"
                type="natural"
                fill="url(#fillGradient)"
                stroke={`var(--primary`}
                strokeWidth={2}
              />  
            </AreaChart>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}
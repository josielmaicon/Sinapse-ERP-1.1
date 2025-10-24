"use client"

import * as React from "react"
import { format, subDays, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Area, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Line } from "recharts"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"
import { Loader2, Calendar as CalendarIcon, ArrowUp, ArrowDown } from "lucide-react"

export default function PdvRevenueChart() {
  // ✅ 1. 'timeframe' agora controla a lógica
  const [timeframe, setTimeframe] = React.useState("daily"); // Começa na visão "Diário"
  const [selectedPdvKey, setSelectedPdvKey] = React.useState("all");
  const [dateRange, setDateRange] = React.useState({ from: subDays(new Date(), 29), to: new Date() });
  
  const [rawData, setRawData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  // ✅ 2. useEffect agora "ouve" o 'timeframe'
  React.useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      
      // Decide qual URL da API chamar
      const isDailyView = timeframe === 'daily';
      const endpoint = isDailyView
        ? "http://localhost:8000/vendas/resumo-hoje-por-hora"
        : "http://localhost:8000/vendas/resumo-diario-dinamico";

      try {
        const response = await fetch(endpoint);
        if (!response.ok) throw new Error("Falha ao buscar dados do resumo");
        const data = await response.json();
        setRawData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchChartData();
  }, [timeframe]); // Roda quando 'timeframe' muda
  
  // ✅ 3. O "Montador" agora lida com os dois formatos de dados
  const { chartData, chartConfig } = React.useMemo(() => {
    if (rawData.length === 0) return { chartData: [], chartConfig: {} };

    const isDailyView = timeframe === 'daily';
    const pdvMap = new Map();
    const dataKey = isDailyView ? 'hour' : 'date'; // 'hour' ou 'date'
    const pdvDataKey = 'faturamento_por_pdv';

    rawData.forEach(entry => {
      entry[pdvDataKey].forEach(pdv => {
        const pdvKey = `pdv_${pdv.pdv_id}`;
        if (!pdvMap.has(pdvKey)) {
          pdvMap.set(pdvKey, { name: pdv.pdv_nome });
        }
      });
    });

    const dynamicChartConfig = {};
    let colorIndex = 1;
    pdvMap.forEach((pdv, key) => {
      dynamicChartConfig[key] = { label: pdv.name, color: `var(--chart-${colorIndex})` };
      colorIndex++;
    });

    const transformedData = rawData.map(entry => {
      const dayData = { [dataKey]: entry[dataKey] };
      pdvMap.forEach((_, key) => { dayData[key] = 0; });
      entry[pdvDataKey].forEach(pdv => {
        const pdvKey = `pdv_${pdv.pdv_id}`;
        dayData[pdvKey] = pdv.total;
      });
      return dayData;
    });

    return { chartData: transformedData, chartConfig: dynamicChartConfig };
  }, [rawData, timeframe]);

  // ✅ 4. O filtro de data agora só se aplica na visão "Mensal"
  const filteredData = React.useMemo(() => {
    if (timeframe === 'daily') {
      return chartData; // Na visão diária, mostramos todos os dados (horas)
    }
    
    if (!dateRange?.from) return [];
    return chartData.filter(item => {
        const itemDate = new Date(item.date);
        const fromDate = new Date(dateRange.from);
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
        itemDate.setHours(0, 0, 0, 0);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);
        return itemDate >= fromDate && itemDate <= toDate;
    });
  }, [chartData, dateRange, timeframe]);
  
  // A lógica de 'stats' continua funcionando como antes
  const stats = React.useMemo(() => {
    if (filteredData.length === 0) return { totalRevenue: 0 };
    
    const pdvsToSum = selectedPdvKey === 'all' 
        ? Object.keys(chartConfig) 
        : [selectedPdvKey];

    const totalRevenue = filteredData.reduce((acc, day) => {
        let dayTotal = 0;
        pdvsToSum.forEach(pdvKey => {
            dayTotal += day[pdvKey] || 0;
        });
        return acc + dayTotal;
    }, 0);
    
    return { totalRevenue };
  }, [filteredData, selectedPdvKey, chartConfig]);
  
  const pdvsToDisplay = selectedPdvKey === "all" ? Object.keys(chartConfig) : [selectedPdvKey];
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* 🔸 Filtros e seleção */}
      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 mb-4">
        <Select value={selectedPdvKey} onValueChange={setSelectedPdvKey}>
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Selecionar PDV" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os PDVs</SelectItem>
            {Object.entries(chartConfig).map(([key, config]) => (
                <SelectItem key={key} value={key}>{config.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* ✅ 5. O seletor de data agora só aparece na visão 'monthly' */}
        {timeframe === "monthly" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button id="date" variant={"outline"} /* ... */ >
                {/* ... (conteúdo do botão de data) ... */}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="range" /* ... */ />
            </PopoverContent>
          </Popover>
        )}

        <Button
          size="sm"
          variant={timeframe === "daily" ? "default" : "outline"}
          onClick={() => setTimeframe("daily")}
        >
          Diário
        </Button>
        <Button
          size="sm"
          variant={timeframe === "monthly" ? "default" : "outline"}
          onClick={() => setTimeframe("monthly")}
        >
          Mensal
        </Button>
      </div>

      {/* 🔸 Estatísticas do topo */}
      <div className="pl-5 pb-5">
        <p className="text-sm text-muted-foreground">Faturamento Geral</p>
        <div className="flex items-baseline gap-2">
          <p className="text-4xl font-bold tracking-tighter text-primary">
            {stats.totalRevenue.toLocaleString("pt-BR", {
              style: "currency",
              currency: "BRL",
            })}
          </p>
          {stats.hasPreviousData && (
            <div
              className={cn(
                "flex items-center text-sm font-semibold",
                stats.percentageChange >= 0
                  ? "text-green-500"
                  : "text-red-500"
              )}
            >
              {stats.percentageChange >= 0 ? (
                <ArrowUp className="h-4 w-4" />
              ) : (
                <ArrowDown className="h-4 w-4" />
              )}
              <span>{stats.percentageChange.toFixed(1)}%</span>
            </div>
          )}
        </div>
      </div>

      {/* 🔸 Gráfico */}
      <div className="flex-grow w-full relative overflow-hidden">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
              <ComposedChart
                data={filteredData}
                margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  {Object.keys(chartConfig).map((key) => (
                  <linearGradient key={key} id={`fill${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.1} />
                  </linearGradient>
                ))}
                </defs>
                <CartesianGrid vertical={false} />
                
                {/* ✅ 6. JSX CONDICIONAL PARA O EIXO X */}
                <XAxis
                  dataKey={timeframe === 'monthly' ? 'date' : 'hour'}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={
                    timeframe === 'monthly' 
                      ? (value) => format(new Date(value), "dd/MM") 
                      : (value) => value // Simplesmente mostra a hora (ex: "08:00")
                  }
                />
                <YAxis tickFormatter={(value) => value.toLocaleString("pt-BR")} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      formatter={(value, name) => [
                        value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
                        chartConfig[name].label,
                      ]}
                      labelFormatter={
                        timeframe === 'monthly'
                          ? (label) => format(new Date(label), "PPP", { locale: ptBR })
                          : (label) => `Às ${label}` // Formato para o tooltip de hora
                      }
                    />
                  }
                />
              {pdvsToDisplay.map((pdvKey) => (
                <Area
                  key={pdvKey}
                  type="natural"
                  dataKey={pdvKey}
                  fill={`url(#fill${pdvKey})`}
                  stroke={`var(--color-${pdvKey})`}
                  strokeWidth={2}
                  dot={false}
                />
              ))}
              </ComposedChart>
            </ChartContainer>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
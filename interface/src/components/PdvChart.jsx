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
  
  const [timeframe, setTimeframe] = React.useState("30d");
  const [selectedPdvKey, setSelectedPdvKey] = React.useState("all");
  const [dateRange, setDateRange] = React.useState({ from: subDays(new Date(), 29), to: new Date() });
  
  const [rawData, setRawData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:8000/vendas/resumo-diario-dinamico");
        if (!response.ok) throw new Error("Falha ao buscar dados do resumo diário");
        const data = await response.json();
        setRawData(data);
      } catch (error) {
        console.error(error);
        // Aqui você pode mostrar um toast de erro
      } finally {
        setIsLoading(false);
      }
    };
    fetchChartData();
  }, []);
  
  const { chartData, chartConfig } = React.useMemo(() => {
    if (rawData.length === 0) return { chartData: [], chartConfig: {} };

    const pdvMap = new Map();
    rawData.forEach(day => {
      day.faturamento_por_pdv.forEach(pdv => {
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

    const transformedData = rawData.map(day => {
      const dayData = { date: day.date };
      pdvMap.forEach((_, key) => { dayData[key] = 0; });
      day.faturamento_por_pdv.forEach(pdv => {
        const pdvKey = `pdv_${pdv.pdv_id}`;
        dayData[pdvKey] = pdv.total;
      });
      return dayData;
    });

    return { chartData: transformedData, chartConfig: dynamicChartConfig };
  }, [rawData]);

  const filteredData = React.useMemo(() => {
    if (!dateRange?.from) return [];

    return chartData.filter(item => {
        const itemDate = new Date(item.date);
        const fromDate = new Date(dateRange.from);
        const toDate = dateRange.to ? new Date(dateRange.to) : new Date(dateRange.from);
        
        // Ajusta as datas para ignorar a hora
        itemDate.setHours(0, 0, 0, 0);
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(0, 0, 0, 0);

        return itemDate >= fromDate && itemDate <= toDate;
    });
  }, [chartData, dateRange]);
  
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
            <SelectItem value="pdv1">PDV 01</SelectItem>
            <SelectItem value="pdv2">PDV 02</SelectItem>
            <SelectItem value="pdv3">PDV 03</SelectItem>
          </SelectContent>
        </Select>

        {timeframe === "monthly" && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date"
                variant={"outline"}
                className={cn(
                  "w-[260px] h-9 justify-start text-left font-normal",
                  !dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "}
                      {format(dateRange.to, "LLL dd, y", { locale: ptBR })}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y", { locale: ptBR })
                  )
                ) : (
                  <span>Escolha um período</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                locale={ptBR}
              />
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
        <ResponsiveContainer width="100%" height="100%">
          <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
            <ComposedChart
              data={filteredData}
              margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
            >
              {/* ✅ Gradientes e cores dinâmicas */}
              <defs>
                {Object.keys(chartConfig).map((key) => (
                  <linearGradient key={key} id={`fill${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${key})`} stopOpacity={0.8} />
                    <stop offset="95%" stopColor={`var(--color-${key})`} stopOpacity={0.1} />
                  </linearGradient>
                ))}
              </defs>

              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => format(new Date(value), "dd/MM")}
              />
              <YAxis
                tickFormatter={(value) => value.toLocaleString("pt-BR")}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => [
                      value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }),
                      chartConfig[name].label,
                    ]}
                    labelFormatter={(label) =>
                      format(new Date(label), "PPP", { locale: ptBR })
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
      </div>
    </div>
  )
}

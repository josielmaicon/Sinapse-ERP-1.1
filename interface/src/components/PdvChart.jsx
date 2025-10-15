"use client"

import * as React from "react"
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon, ArrowUp, ArrowDown } from "lucide-react"
import {
  Area,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Line,
} from "recharts"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

// 📊 Geração de dados mockados
const generateMockData = () => {
  const data = []
  for (let i = 90; i >= 0; i--) {
    const date = subDays(new Date(), i)
    data.push({
      date: format(date, "yyyy-MM-dd"),
      pdv1: Math.floor(Math.random() * (1200 - 500 + 1)) + 500,
      pdv2: Math.floor(Math.random() * (1000 - 400 + 1)) + 400,
      pdv3: Math.floor(Math.random() * (800 - 200 + 1)) + 200,
    })
  }
  return data
}
const chartData = generateMockData()

// ⚙️ CORRIGIDO: usar var(--chart-1/2/3) para o ChartContainer gerar as vars --color-pdv*
const chartConfig = {
  pdv1: { label: "PDV 01", color: "var(--chart-1)" },
  pdv2: { label: "PDV 02", color: "var(--chart-2)" },
  pdv3: { label: "PDV 03", color: "var(--chart-3)" },
}

export default function PdvRevenueChart() {
  const [timeframe, setTimeframe] = React.useState("daily")
  const [selectedPdv, setSelectedPdv] = React.useState("all")
  const [dateRange, setDateRange] = React.useState({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  const filteredData = React.useMemo(() => {
    let data = chartData

    if (timeframe === "monthly" && dateRange?.from && dateRange?.to) {
      data = chartData.filter((item) => {
        const itemDate = new Date(item.date)
        return itemDate >= dateRange.from && itemDate <= dateRange.to
      })
    } else {
      data = chartData.slice(-30)
    }
    return data
  }, [timeframe, dateRange])

  const stats = React.useMemo(() => {
    if (!filteredData || filteredData.length === 0) {
      return { totalRevenue: 0, percentageChange: 0, hasPreviousData: false }
    }
    const totalRevenue = filteredData.reduce(
      (acc, day) => acc + (day.pdv1 || 0) + (day.pdv2 || 0) + (day.pdv3 || 0),
      0
    )
    const firstDate = new Date(filteredData[0].date)
    const lastDate = new Date(filteredData[filteredData.length - 1].date)
    const duration = Math.round((lastDate - firstDate) / (1000 * 60 * 60 * 24))
    const prevPeriodEndDate = subDays(firstDate, 1)
    const prevPeriodStartDate = subDays(prevPeriodEndDate, duration)
    const prevPeriodData = chartData.filter((item) => {
      const itemDate = new Date(item.date)
      return itemDate >= prevPeriodStartDate && itemDate <= prevPeriodEndDate
    })
    if (prevPeriodData.length === 0) {
      return { totalRevenue, percentageChange: 0, hasPreviousData: false }
    }
    const previousRevenue = prevPeriodData.reduce(
      (acc, day) => acc + (day.pdv1 || 0) + (day.pdv2 || 0) + (day.pdv3 || 0),
      0
    )
    if (previousRevenue === 0) {
      return {
        totalRevenue,
        percentageChange: totalRevenue > 0 ? 100 : 0,
        hasPreviousData: true,
      }
    }
    const percentageChange =
      ((totalRevenue - previousRevenue) / previousRevenue) * 100
    return { totalRevenue, percentageChange, hasPreviousData: true }
  }, [filteredData])

  const pdvsToDisplay =
    selectedPdv === "all" ? Object.keys(chartConfig) : [selectedPdv]

  return (
    <div className="w-full h-full flex flex-col">
      {/* 🔸 Filtros e seleção */}
      <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 mb-4">
        <Select value={selectedPdv} onValueChange={setSelectedPdv}>
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
          <p className="text-6xl font-regular tracking-tighter">
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
      <div className="flex-grow w-full relative">
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

              {/* ✅ Usa as variáveis geradas pelo ChartContainer */}
              {pdvsToDisplay.map((pdvKey) => [
                <Area
                  key={`${pdvKey}-area`}
                  type="linear"
                  dataKey={pdvKey}
                  fill={`url(#fill${pdvKey})`}
                  stroke="none"
                />,
                <Line
                  key={`${pdvKey}-line`}
                  type="linear"
                  dataKey={pdvKey}
                  stroke={`var(--color-${pdvKey})`}
                  strokeWidth={2}
                  dot={false}
                />,
              ])}
            </ComposedChart>
          </ChartContainer>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

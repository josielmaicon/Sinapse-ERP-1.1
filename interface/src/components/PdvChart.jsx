"use client"

import * as React from "react"
// ... (todos os outros imports continuam os mesmos)
import { format, subDays } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CardDescription, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"


// ... (a parte de gerar dados e a lógica de estado continua a mesma)
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

const chartConfig = {
  pdv1: { label: "PDV 01", color: "hsl(var(--chart-1))" },
  pdv2: { label: "PDV 02", color: "hsl(var(--chart-2))" },
  pdv3: { label: "PDV 03", color: "hsl(var(--chart-3))" },
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

  const pdvsToDisplay =
    selectedPdv === "all"
      ? Object.keys(chartConfig)
      : [selectedPdv]

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* ... (cabeçalho com título e botões continua o mesmo) ... */}
        <div>
          <CardTitle>Faturamento por PDV</CardTitle>
          <CardDescription>
            Análise do faturamento diário ou mensal por ponto de venda.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
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
      </div>
      
      <div className="flex-grow flex flex-col">
        <div className="my-4 flex items-center gap-4">
          {/* ... (filtros de Select e Data continuam os mesmos) ... */}
          <Select value={selectedPdv} onValueChange={setSelectedPdv}>
            <SelectTrigger className="w-[180px]">
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
                 className={cn( "w-[300px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}
               >
                 <CalendarIcon className="mr-2 h-4 w-4" />
                 {dateRange?.from ? ( dateRange.to ? ( <> {format(dateRange.from, "LLL dd, y", { locale: ptBR })} -{" "} {format(dateRange.to, "LLL dd, y", { locale: ptBR })} </> ) : ( format(dateRange.from, "LLL dd, y", { locale: ptBR }) ) ) : ( <span>Escolha um período</span> )}
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
        </div>
        
        {/* ✅ --- AQUI ESTÁ A CORREÇÃO --- ✅ */}
        <div className="w-full flex-grow relative">
          <ResponsiveContainer width="100%" height="100%">
            {/* O ChartContainer volta para dentro do ResponsiveContainer, envolvendo o AreaChart */}
            <ChartContainer config={chartConfig}>
              <AreaChart data={filteredData}>
                <defs>
                  {Object.keys(chartConfig).map((key) => (
                    <linearGradient key={key} id={`fill${key}`} x1="0" y1="0" x2="0" y2="1" >
                      <stop offset="5%" stopColor={chartConfig[key].color} stopOpacity={0.8} />
                      <stop offset="95%" stopColor={chartConfig[key].color} stopOpacity={0.1} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => format(new Date(value), "dd/MM")} />
                <YAxis tickFormatter={(value) => `R$ ${value.toLocaleString("pt-BR")}`} />
                <Tooltip content={ <ChartTooltipContent formatter={(value, name) => [ `R$ ${Number(value).toLocaleString("pt-BR")}`, chartConfig[name].label, ]} labelFormatter={(label) => format(new Date(label), "PPP", { locale: ptBR })} indicator="dot" /> } />
                {pdvsToDisplay.map((pdvKey) => ( <Area key={pdvKey} dataKey={pdvKey} type="natural" fill={`url(#fill${pdvKey})`} stroke={chartConfig[pdvKey].color} stackId="a" /> ))}
              </AreaChart>
            </ChartContainer>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
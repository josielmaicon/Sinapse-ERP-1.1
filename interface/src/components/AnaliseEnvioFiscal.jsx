// src/components/fiscal/FiscalSummaryChart.jsx
"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import { AlertCircle, FileClock } from "lucide-react"

import {
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"

const today = new Date().getDate()
const chartData = Array.from({ length: today }, (_, i) => ({
  day: (i + 1).toString(),
  // Simula emissões até o dia atual: os dias passados têm valores, os próximos não existem
  issuedValue: Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000,
}))

const chartConfig = {
  issuedValue: {
    label: "Valor Emitido",
    color: "hsl(var(--primary))",
  },
}

// MOCK: Dados para os indicadores de auditoria
const auditData = {
  rejectedCount: 3,
  oldPendingCount: 15,
}

export default function FiscalSummaryChart() {
  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Resumo Gráfico do Período</CardTitle>
        <CardDescription>
          Análise visual das emissões fiscais no mês atual.
        </CardDescription>
      </CardHeader>

      <div className="flex-grow w-full min-h-0">
        <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 30, right: 10, left: 10, bottom: 0 }}
            barCategoryGap="20%"
            barGap={2}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={6}
              axisLine={false}
              minTickGap={4}
              interval={0}
              padding={{ left: 10, right: 10 }}
            />

            <YAxis
              width={0}
              axisLine={false}
              tickLine={false}
              tick={false}
            />

            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              content={
                <ChartTooltipContent
                  formatter={(value) =>
                    value.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })
                  }
                  hideLabel
                />
              }
            />

            <Bar
              dataKey="issuedValue"
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
              maxBarSize={20}
            >
              <LabelList
                position="top"
                offset={8}
                className="fill-foreground text-xs"
                formatter={(value) =>
                  value > 0 ? `${(value / 1000).toFixed(0)}k` : ""
                }
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      <CardFooter className="flex-col items-start gap-4 text-sm border-t pt-4">
        <p className="font-semibold">Pontos de Atenção (Auditoria):</p>
        <div className="w-full flex justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-muted-foreground">Notas Rejeitadas:</span>
            <Button variant="link" className="p-0 h-auto text-destructive font-bold">
              {auditData.rejectedCount}
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <FileClock className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">Pendentes (+7d):</span>
            <Button variant="link" className="p-0 h-auto font-bold">
              {auditData.oldPendingCount}
            </Button>
          </div>
        </div>
      </CardFooter>
    </div>
  )
}

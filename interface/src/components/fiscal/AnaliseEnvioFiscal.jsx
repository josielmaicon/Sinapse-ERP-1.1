// src/components/fiscal/FiscalSummaryChart.jsx

"use client"

import * as React from "react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"
import { AlertCircle, FileClock } from "lucide-react"
import { CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

const chartConfig = {
  issuedValue: {
    label: "Valor Emitido",
    color: "hsl(var(--primary))",
  },
}

export default function FiscalSummaryChart({ dailyData, rejectedCount, oldPendingCount, isLoading }) {
  
  if (isLoading) {
    return (
      <div className="p-4 h-full flex flex-col">
        <Skeleton className="h-6 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-8" />
        <Skeleton className="h-full w-full" />
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col">
      <CardHeader className="flex-shrink-0">
        <CardTitle>Resumo Gráfico do Período</CardTitle>
        <CardDescription>Análise visual das emissões fiscais no mês atual.</CardDescription>
      </CardHeader>

      <div className="flex-grow w-full min-h-0">
        <ChartContainer config={chartConfig} className="w-full h-full aspect-auto">
          <BarChart
            accessibilityLayer
            data={dailyData}
            // ✅ CORREÇÃO AQUI: Margens positivas para garantir que o gráfico seja visível
            margin={{
              top: 30,    // Espaço para os labels "k" acima das barras
              right: 20,   // Espaço na direita
              left: 20,    // Espaço na esquerda para o eixo Y não ficar colado
              bottom: 5,   // Espaço para o eixo X
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="day"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tickMargin={8}
              tickFormatter={(value) => `${value / 1000}k`}
            />

            <ChartTooltip
              cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              content={
                <ChartTooltipContent 
                    formatter={(value) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    hideLabel 
                />
              }
            />
            <Bar dataKey="issuedValue" fill="var(--color-primary)" radius={[4, 4, 0, 0]}>
            <LabelList
              position="top"
              offset={8}
              className="fill-foreground text-xs"
              formatter={(value) => {
                if (value >= 1000) {
                  return `${(value / 1000).toFixed(0)}k`; // acima de 1000, mostra resumo
                } else if (value > 0) {
                  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); // abaixo de 1000, mostra valor completo
                } else {
                  return "";
                }
              }}
            />
            </Bar>
          </BarChart>
        </ChartContainer>
      </div>

      <CardFooter className="flex-shrink-0 flex-col items-start gap-4 text-sm border-t pt-4">
        <p className="font-semibold">Pontos de Atenção (Auditoria):</p>
        <div className="w-full flex justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-muted-foreground">Notas Rejeitadas:</span>
            <Button variant="link" className="p-0 h-auto text-destructive font-bold">{rejectedCount}</Button>
          </div>
          <div className="flex items-center gap-2">
            <FileClock className="h-4 w-4 text-amber-500" />
            <span className="text-muted-foreground">Pendentes (+7d):</span>
            <Button variant="link" className="p-0 h-auto font-bold">{oldPendingCount}</Button>
          </div>
        </div>
      </CardFooter>
    </div>
  )
}
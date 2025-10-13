// src/components/TopProductsChart.jsx

"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// ... (mock data e chartConfig continuam os mesmos)
const chartData = [
  { name: "Leite Integral", totalSales: 2850.75 },
  { name: "Pão Francês", totalSales: 2100.40 },
  { name: "Coca-Cola 2L", totalSales: 1730.00 },
  { name: "Contra-filé Kg", totalSales: 1520.10 },
  { name: "Cerveja Skol Lt", totalSales: 1280.50 },
].sort((a, b) => a.totalSales - b.totalSales)

const chartConfig = {
  totalSales: {
    label: "Vendas (R$)",
    color: "hsl(var(--primary))",
  },
  label: {
    color: "hsl(var(--background))",
  }
}

export default function TopProductsChart() {
  return (
    <div className="w-full h-full flex items-center justify-center min-h-0 min-w-0">
      <ChartContainer config={chartConfig} className="w-full h-full min-h-0 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              top: 0,
              right: 40,
              left: 0,
              bottom: 0,
            }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={0} />
            <XAxis dataKey="totalSales" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="line" />} />
            <Bar
              dataKey="totalSales"
              layout="vertical"
              fill="var(--color-totalSales)"
              radius={4}
              barSize={25}
            >
              <LabelList
                dataKey="name"
                position="insideLeft"
                offset={8}
                className="fill-[hsl(var(--primary-foreground))]"
                fontSize={12}
              />
              <LabelList
                dataKey="totalSales"
                position="right"
                offset={8}
                className="fill-foreground"
                fontSize={12}
                formatter={(value) =>
                  value > 1000
                    ? `R$ ${(value / 1000).toFixed(1)}K`
                    : value.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                }
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  )
}

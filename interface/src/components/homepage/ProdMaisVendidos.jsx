"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"

import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  XAxis,
  YAxis,
  ResponsiveContainer
} from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

// ✅ Correção: define a cor e o label aqui, que será usada pelo ChartContainer
const chartConfig = {
  totalSales: {
    label: "Vendas (R$)",
    color: "hsl(var(--primary))", // Usa o token de cor da paleta de gráficos
  },
}

export default function TopProductsChart() {
const [chartData, setChartData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchTopProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:8000/vendas/top-produtos");
        if (!response.ok) throw new Error("Falha ao buscar top produtos");
        let data = await response.json();
        
        // Ordena os dados do menor para o maior para o gráfico renderizar de baixo para cima
        data.sort((a, b) => b.totalSales - a.totalSales);
        
        setChartData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopProducts();
  }, []);

  const maxValue = chartData.length > 0 ? Math.max(...chartData.map((item) => item.totalSales)) : 0;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      <div className="absolute top-0 left-0 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          
          {/* ✅ ChartContainer reinserido corretamente */}
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 60, left: 0, bottom: 5 }}
            >
              <CartesianGrid horizontal={false} />
              <YAxis
                dataKey="name"
                type="category"
                tickLine={false}
                axisLine={false}
                width={0}
              />
              <XAxis dataKey="totalSales" type="number" hide domain={[0, maxValue]} />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent indicator="line" />}
              />
              
              {/* ✅ Aqui a cor vem do ChartContainer */}
              <Bar
                dataKey="totalSales"
                fill="var(--primary)"
                radius={4}
                barSize={25}
              >
                <LabelList
                  dataKey="name"
                  position="insideLeft"
                  offset={8}
                  className="fill-background"
                  fontSize={12}
                />
                <LabelList
                  dataKey="totalSales"
                  position="right"
                  offset={8}
                  className="fill-foreground"
                  fontSize={12}
                  formatter={(value) =>
                    value >= 1000
                      ? `R$ ${(value / 1000).toFixed(1)}K`
                      : value.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                  }
                />
              </Bar>
            </BarChart>
          </ChartContainer>

        </ResponsiveContainer>
      </div>
    </div>
  )
}

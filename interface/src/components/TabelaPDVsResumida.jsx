// src/components/PdvStatusTable.jsx

"use client"

import * as React from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/SimpleTable"

// 🧩 MOCK: Novos dados mais realistas para os PDVs
const pdvData = [
  { id: 1, name: "Caixa 01", operator: "Ana Paula", revenue: 2150.70, status: "aberto", statusDetail: "Em operação desde 08:02" },
  { id: 2, name: "Caixa 02", operator: "Carlos Souza", revenue: 1840.25, status: "aberto", statusDetail: "Em operação desde 08:05" },
  { id: 3, name: "Caixa 03", operator: "Mariana Lima", revenue: 0, status: "fechado", statusDetail: "Fechado desde ontem às 18:00" },
  { id: 4, name: "Caixa 04", operator: "Jorge Dias", revenue: 1980.50, status: "aberto", statusDetail: "Em operação desde 09:15" },
  { id: 5, name: "Caixa 05", operator: "N/D", revenue: 0, status: "fechado", statusDetail: "Inativo" },
  { id: 6, name: "Self-Checkout", operator: "N/D", revenue: 950.80, status: "pausado", statusDetail: "Pausado para manutenção às 13:10" },
];

export default function PdvStatusTable() {
  // Estado para controlar o filtro selecionado
  const [filter, setFilter] = React.useState("todos");

  // Filtra os dados com base no estado. useMemo otimiza a performance.
  const filteredData = React.useMemo(() => {
    if (filter === "abertos") {
      return pdvData.filter((pdv) => pdv.status === "aberto");
    }
    if (filter === "fechados") {
      return pdvData.filter((pdv) => pdv.status !== "aberto");
    }
    return pdvData; // Filtro "todos"
  }, [filter]);

  // Define as colunas da nossa nova tabela
  const columns = ["PDV", "Operador", "Faturamento (R$)", ""]; // Coluna de status não tem título

  return (
    // TooltipProvider é necessário para os tooltips funcionarem
    <TooltipProvider>
      <div className="h-full flex flex-col">
        {/* Grupo de botões de filtro */}
        <div className="flex-shrink-0 mb-4">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="abertos">Abertos</TabsTrigger>
              <TabsTrigger value="fechados">Fechados</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Container da Tabela com scroll */}
        <div className="flex-grow overflow-y-auto min-h-0">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.operator}</TableCell>
                  <TableCell>{item.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell className="text-right">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {/* A bolinha de status */}
                        <div
                          className={`inline-block w-2.5 h-2.5 rounded-full ${
                            item.status === 'aberto' ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        />
                      </TooltipTrigger>
                      {/* O conteúdo do tooltip */}
                      <TooltipContent>
                        <p>{item.statusDetail}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  )
}
"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/SimpleTable"
import { Skeleton } from "@/components/ui/skeleton" // Importe o Skeleton

// ❌ O MOCK FOI REMOVIDO

export default function PdvStatusTable() {
  // ✅ 1. ESTADOS PARA OS DADOS, FILTRO E LOADING
  const [pdvData, setPdvData] = React.useState([]);
  const [filter, setFilter] = React.useState("todos");
  const [isLoading, setIsLoading] = React.useState(true);

  // ✅ 2. useEffect PARA BUSCAR DADOS QUANDO O FILTRO MUDA
  React.useEffect(() => {
    const fetchPdvData = async () => {
      setIsLoading(true);
      try {
        // O filtro é passado como um parâmetro na URL
        const response = await fetch(`http://localhost:8000/api/pdvs?status=${filter}`);
        if (!response.ok) throw new Error("Falha ao buscar dados dos PDVs");
        const data = await response.json();
        setPdvData(data);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPdvData();
  }, [filter]); // A mágica da reatividade: roda toda vez que 'filter' muda

  const columns = ["PDV", "Operador", "Em caixa", ""];

  return (
    <TooltipProvider>
      <div className="h-full flex flex-col">
        <div className="flex-shrink-0 mb-4">
          <Tabs value={filter} onValueChange={setFilter}>
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="aberto">Abertos</TabsTrigger>
              <TabsTrigger value="fechados">Fechados</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

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
              {/* ✅ 3. LÓGICA DE LOADING COM SKELETON */}
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-3 w-3 rounded-full" /></TableCell>
                  </TableRow>
                ))
              ) : (
                pdvData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.nome}</TableCell>
                    {/* Agora pegamos o nome do operador do objeto aninhado */}
                    <TableCell>{item.operador_atual?.nome ?? "N/D"}</TableCell>
                    {/* O 'inregister' virá de outra chamada no futuro, por enquanto deixamos 0 */}
                    <TableCell>R$ 0,00</TableCell>
                    <TableCell className="text-right">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              item.status === 'aberto' ? 'bg-green-500' : 
                              item.status === 'pausado' ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="capitalize">{item.status}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </TooltipProvider>
  )
}
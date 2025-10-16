"use client"

import * as React from "react"
import { Power, Pause, DollarSign, HandCoins, ExternalLink } from "lucide-react"
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { pdvColumns } from "./ColunasPDV"
import { operatorColumns } from "./ColunasOPR"

const pdvData = [
  { id: "PDV-01", name: "Caixa 01", operator: "Ana Paula", inRegister: 2150.7, status: "aberto" },
  { id: "PDV-02", name: "Caixa 02", operator: "Carlos Souza", inRegister: 1840.25, status: "aberto" },
  { id: "PDV-03", name: "Caixa 03", operator: "Mariana Lima", inRegister: 0, status: "fechado" },
]

const operatorData = [
  { id: "OP-1", name: "Ana Paula", hoursToday: "6h 15m", ticketMedio: 52.45, status: "ativo" },
  { id: "OP-2", name: "Carlos Souza", hoursToday: "5h 45m", ticketMedio: 48.9, status: "ativo" },
  { id: "OP-3", name: "Mariana Lima", hoursToday: "0h 0m", ticketMedio: 0, status: "inativo" },
]

const CURRENT_MACHINE_PDV_ID = "PDV-01"

export default function PdvDataTable({ onPdvSelect }) {
  const [viewMode, setViewMode] = React.useState("pdvs")
  const [sorting, setSorting] = React.useState([])
  const [selectedRow, setSelectedRow] = React.useState(null)

  const { columns, data } = React.useMemo(() => {
    return viewMode === "pdvs" ? { columns: pdvColumns, data: pdvData } : { columns: operatorColumns, data: operatorData }
  }, [viewMode])

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: { sorting },
  })

  React.useEffect(() => {
    if (onPdvSelect) onPdvSelect(viewMode === "pdvs" ? selectedRow : null)
  }, [selectedRow, onPdvSelect, viewMode])

  const handleRowClick = (row) => {
    setSelectedRow(selectedRow?.id === row.original.id ? null : row.original)
  }

  const handleAction = (action) => {
    alert(`Ação: ${action} no item ${selectedRow?.name}`)
  }

  const isCurrentMachineSelected = viewMode === "pdvs" && selectedRow?.id === CURRENT_MACHINE_PDV_ID
  const numSelected = selectedRow ? 1 : 0
  const buttonsDisabled = viewMode === "operadores" || numSelected === 0

  return (
    <TooltipProvider>
      <div className="w-full h-full flex flex-col">
        {/* CABEÇALHO */}
        <div className="flex-shrink-0 flex items-center justify-between py-4">
          <Tabs value={viewMode} onValueChange={setViewMode}>
            <TabsList>
              <TabsTrigger value="pdvs">PDVs</TabsTrigger>
              <TabsTrigger value="operadores">Operadores</TabsTrigger>
            </TabsList>
          </Tabs>
          <Input placeholder="Filtrar por nome..." className="w-1/2" />
        </div>

        {/* ÁREA TABELA + PAGINAÇÃO */}
        <div className="flex-grow rounded-md overflow-y-auto border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(h => (
                    <TableHead key={h.id}>{flexRender(h.column.columnDef.header, h.getContext())}</TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map(row => {
                  const isSelected = selectedRow?.id === row.original.id
                  return (
                    <TableRow
                      key={row.id}
                      data-state={isSelected && "selected"}
                      onClick={() => handleRowClick(row)}
                      className={`cursor-pointer transition-colors ${isSelected ? "bg-muted hover:bg-muted/90" : "hover:bg-muted/50"}`}
                    >
                      {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      ))}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    Nenhum resultado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* PAGINAÇÃO */}
        <div className="flex-shrink-0 flex items-center justify-between py-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={e => { e.preventDefault(); table.previousPage() }} disabled={!table.getCanPreviousPage()} />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" onClick={e => { e.preventDefault(); table.nextPage() }} disabled={!table.getCanNextPage()} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        {/* BOTÕES DE AÇÃO */}
          <div className="flex-shrink-0 flex items-center justify-end gap-2 py-4">
            {isCurrentMachineSelected && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" onClick={() => alert("Navegando...")}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Abrir Interface
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Navegar para o PDV selecionado</TooltipContent>
              </Tooltip>
            )}
            {["Abrir Caixa","Pausar","Sangria","Fechar Caixa"].map((action, idx) => (
              <Tooltip key={idx}>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant={action === "Sangria" ? "secondary" : action === "Fechar Caixa" ? "destructive" : "outline"}
                    disabled={buttonsDisabled}
                    onClick={() => handleAction(action)}
                  >
                    {{
                      "Abrir Caixa": <Power className="h-4 w-4" />,
                      "Pausar": <Pause className="h-4 w-4" />,
                      "Sangria": <HandCoins className="h-4 w-4" />,
                      "Fechar Caixa": <DollarSign className="h-4 w-4" />,
                    }[action]}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{action}</TooltipContent>
              </Tooltip>
            ))}
          </div>
      </div>
    </TooltipProvider>
  )
}

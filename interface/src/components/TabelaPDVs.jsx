// src/components/pdvs/PdvDataTable.jsx

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
import { useNavigate } from "react-router-dom";

// Importe as colunas
import { pdvColumns } from "./ColunasPDV"
import { operatorColumns } from "./ColunasOPR"

// SIMULAÇÃO: Identificador do computador/PDV atual
const CURRENT_MACHINE_PDV_ID = "PDV-01";

export function PdvDataTable({ data: pdvsData, operatorData, onPdvSelect }) {
    const [viewMode, setViewMode] = React.useState("pdvs");
    const [sorting, setSorting] = React.useState([]);
    const [selectedRow, setSelectedRow] = React.useState(null);
    const navigate = useNavigate();

    const { columns, data } = React.useMemo(() => {
        return viewMode === "pdvs" 
            ? { columns: pdvColumns, data: pdvsData } 
            : { columns: operatorColumns, data: operatorData };
    }, [viewMode, pdvsData, operatorData]);

    const table = useReactTable({
        data,
        columns,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: { sorting },
    });

    // Função para lidar com o clique na linha
    const handleRowClick = (row) => {
        const newSelectedRow = selectedRow?.id === row.original.id ? null : row.original;
        setSelectedRow(newSelectedRow);
        
        if (onPdvSelect) {
            onPdvSelect(viewMode === "pdvs" ? newSelectedRow : null);
        }
    }

    const handleAction = (action) => { alert(`Ação: ${action} no item ${selectedRow?.name}`) };
    const isCurrentMachineSelected = viewMode === "pdvs" && selectedRow?.id === CURRENT_MACHINE_PDV_ID;
    const numSelected = selectedRow ? 1 : 0;
    const buttonsDisabled = viewMode === "operadores" || numSelected === 0;

    const handleOpenInterface = () => {
            // A função 'navigate' nos leva para a rota definida no seu routes.jsx
            navigate("/pontovenda");
        };

    return (
        <TooltipProvider>
            <div className="w-full h-full flex flex-col min-h-0">
                {/* --- HEADER --- */}
                <div className="flex-shrink-0 flex items-center justify-between py-2">
                    <Tabs value={viewMode} onValueChange={setViewMode}>
                        <TabsList>
                            <TabsTrigger value="pdvs">PDVs</TabsTrigger>
                            <TabsTrigger value="operadores">Operadores</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Input placeholder={`Filtrar por nome...`} className="w-1/2" />
                </div>

                {/* ÁREA DA TABELA */}
                <div className="flex-grow overflow-y-auto mb-2">
                  <div className="border rounded-md overflow-auto h-full">
                    <Table>
                      <TableHeader>
                        {table.getHeaderGroups().map(hg => (
                          <TableRow key={hg.id}>
                            {hg.headers.map(h => (
                              <TableHead key={h.id}>
                                {flexRender(h.column.columnDef.header, h.getContext())}
                              </TableHead>
                            ))}
                          </TableRow>
                        ))}
                      </TableHeader>
                      <TableBody>
                        {table.getRowModel().rows?.length ? (
                          table.getRowModel().rows.map(row => {
                            const isSelected = selectedRow?.id === row.original.id;
                            return (
                              <TableRow
                                key={row.id}
                                data-state={isSelected && "selected"}
                                onClick={() => handleRowClick(row)}
                                className={`cursor-pointer transition-colors ${
                                  isSelected ? "bg-muted hover:bg-muted/90" : "hover:bg-muted/50"
                                }`}
                              >
                                {row.getVisibleCells().map(cell => (
                                  <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </TableCell>
                                ))}
                              </TableRow>
                            );
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
                </div>

                {/* PAGINAÇÃO */}
                <div className="flex-shrink-0 flex items-center justify-center py-2">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => { e.preventDefault(); table.previousPage(); }}
                          disabled={!table.getCanPreviousPage()}
                        />
                      </PaginationItem>
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); table.nextPage(); }}
                          disabled={!table.getCanNextPage()}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>

                {/* BOTÕES DE AÇÃO */}
                <div className="flex-shrink-0 flex items-center justify-end gap-2 mt-2">
                  {isCurrentMachineSelected && (
                    <Button size="sm" onClick={handleOpenInterface}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Interface
                    </Button>
                  )}
                  <Button variant="outline" size="sm" disabled={buttonsDisabled} onClick={() => handleAction("Abrir Caixa")}>
                    <Power className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={buttonsDisabled} onClick={() => handleAction("Pausar")}>
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" disabled={buttonsDisabled} onClick={() => handleAction("Sangria")}>
                    <HandCoins className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" disabled={buttonsDisabled} onClick={() => handleAction("Fechar Caixa")}>
                    <DollarSign className="h-4 w-4" />
                  </Button>
                </div>
            </div>
        </TooltipProvider>
    );
}
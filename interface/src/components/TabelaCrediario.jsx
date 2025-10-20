// src/components/crediario/CrediarioDataTable.jsx

"use client"

import * as React from "react"
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { XCircle } from "lucide-react"

export function CrediarioDataTable({ columns, data, onClientSelect }) {
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { sorting, columnFilters, rowSelection },
  });

  const isFiltered = table.getState().columnFilters.length > 0;

  React.useEffect(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (onClientSelect) {
      onClientSelect(selectedRows.length === 1 ? selectedRows[0].original : null);
    }
  }, [rowSelection, onClientSelect, table]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Barra de Ferramentas com Filtros */}
      <div className="flex items-center gap-2 py-4">
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={(table.getColumn("clientName")?.getFilterValue()) ?? ""}
          onChange={(event) =>
            table.getColumn("clientName")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Select onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === "todos" ? "" : value)}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por Situação" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="todos">Todas as Situações</SelectItem>
                <SelectItem value="Em Dia">Em Dia</SelectItem>
                <SelectItem value="Atrasado">Atrasado</SelectItem>
            </SelectContent>
        </Select>
        {/* Aqui você poderia adicionar o filtro por valor no futuro */}

        {isFiltered && (
            <Button variant="ghost" onClick={() => table.resetColumnFilters()} className="h-10 px-2 lg:px-3">
                Limpar Filtros
                <XCircle className="ml-2 h-4 w-4" />
            </Button>
        )}
      </div>

      <div className="flex-grow rounded-md border overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer"
                  onClick={() => row.toggleSelected()}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
            {Object.keys(rowSelection).length} de{" "}
            {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="#" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} />
            </PaginationItem>
            {/* Adicione a lógica de paginação com elipses aqui se necessário */}
            <PaginationItem>
              <PaginationNext href="#" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
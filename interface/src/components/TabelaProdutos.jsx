// src/components/products/data-table.jsx

"use client"

import * as React from "react"
import { Pencil, Trash2 } from "lucide-react" 
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
// ✅ 1. Importe os componentes de paginação
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"


export function ProductDataTable({ columns, data }) {
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [rowSelection, setRowSelection] = React.useState({})

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
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  const numSelected = table.getFilteredSelectedRowModel().rows.length

  const handleDelete = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    const idsToDelete = selectedRows.map(row => row.original.id);
    alert(`Excluir itens com IDs: ${idsToDelete.join(", ")}`);
  }
  
  const handleEdit = () => {
    const selectedRow = table.getFilteredSelectedRowModel().rows[0];
    alert(`Editar item com ID: ${selectedRow.original.id}`);
  }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center py-4">
        <Input
          placeholder="Filtrar por nome..."
          value={(table.getColumn("name")?.getFilterValue()) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
      </div>

      <div className="flex-grow rounded-md border overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
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
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum resultado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ 4. O footer foi completamente reconstruído */}
      <div className="flex items-center justify-between py-4">
        {/* Esquerda: Itens selecionados */}
        <div className="flex-1 text-sm text-muted-foreground">
          {numSelected} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>

        {/* Centro: Nova Paginação */}
        <div className="flex-1">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); table.previousPage(); }}
                  disabled={!table.getCanPreviousPage()}
                />
              </PaginationItem>
              {/* Lógica para mostrar os números das páginas (simplificada) */}
              {[...Array(table.getPageCount()).keys()].map(page => (
                 <PaginationItem key={page}>
                    <PaginationLink 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); table.setPageIndex(page); }}
                      isActive={table.getState().pagination.pageIndex === page}
                    >
                      {page + 1}
                    </PaginationLink>
                 </PaginationItem>
              ))}
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

        {/* Direita: Botões de Ação Contextuais */}
        <div className="flex-1 flex justify-end items-center gap-2">
          {numSelected > 0 && (
            <>
              <Button variant="outline" size="sm" disabled={numSelected !== 1} onClick={handleEdit}>
                <Pencil className="h-4 w-4 mr-2" /> Editar
              </Button>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
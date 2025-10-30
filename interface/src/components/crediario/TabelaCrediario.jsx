// src/components/crediario/CrediarioDataTable.jsx

"use client"

import * as React from "react"
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
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
import {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { XCircle } from "lucide-react"

export function CrediarioDataTable({ columns, data, onClientSelect }) {
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
    state: { sorting, columnFilters, rowSelection },
  })

  const isFiltered = table.getState().columnFilters.length > 0

  const DOTS = '...';
  const usePaginationRange = ({ totalPageCount, siblingCount = 1, currentPage }) => {
    return React.useMemo(() => {
      const totalPageNumbers = siblingCount + 5;
      if (totalPageNumbers >= totalPageCount) {
        return Array.from({ length: totalPageCount }, (_, i) => i + 1);
      }
      const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
      const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPageCount);
      const shouldShowLeftDots = leftSiblingIndex > 2;
      const shouldShowRightDots = rightSiblingIndex < totalPageCount - 2;
      const firstPageIndex = 1;
      const lastPageIndex = totalPageCount;

      if (!shouldShowLeftDots && shouldShowRightDots) {
        let leftItemCount = 3 + 2 * siblingCount;
        let leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
        return [...leftRange, DOTS, totalPageCount];
      }
      if (shouldShowLeftDots && !shouldShowRightDots) {
        let rightItemCount = 3 + 2 * siblingCount;
        let rightRange = Array.from({ length: rightItemCount }, (_, i) => totalPageCount - rightItemCount + i + 1);
        return [firstPageIndex, DOTS, ...rightRange];
      }
      if (shouldShowLeftDots && shouldShowRightDots) {
        let middleRange = Array.from({ length: rightSiblingIndex - leftSiblingIndex + 1 }, (_, i) => leftSiblingIndex + i);
        return [firstPageIndex, DOTS, ...middleRange, DOTS, lastPageIndex];
      }
    }, [totalPageCount, siblingCount, currentPage]);
  };

  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const paginationRange = usePaginationRange({
    totalPageCount: totalPages,
    currentPage,
  });

  // 🔁 Atualiza o cliente selecionado externamente
  React.useEffect(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows
    if (onClientSelect) {
      onClientSelect(selectedRows.length === 1 ? selectedRows[0].original : null)
    }
  }, [rowSelection, onClientSelect, table])

  // 🧠 Clique fora da tabela limpa a seleção
React.useEffect(() => {
  const handleClickOutside = (event) => {
    const clickedInsideTable = event.target.closest(".crediario-table-container")
    const clickedInsidePanel = event.target.closest(".client-detail-panel")
    const clickedInsideCadastroModal = event.target.closest(".edit-cadastro-cliente")
    const clickedInsidePagamentoModal = event.target.closest(".edit-limite-cliente")

    // Se clicou fora de tudo, reseta a seleção
    if (
      !clickedInsideTable &&
      !clickedInsidePanel &&
      !clickedInsideCadastroModal &&
      !clickedInsidePagamentoModal
    ) {
      table.resetRowSelection()
    }
  }

  document.addEventListener("click", handleClickOutside)
  return () => document.removeEventListener("click", handleClickOutside)
}, [table])

    React.useEffect(() => {
        if (table) { // Garante que a tabela já foi inicializada
            const paginationState = table.getState().pagination;

        }
    // Adiciona dependências para rodar quando a página mudar
    }, [table, table?.getState().pagination.pageIndex, table?.getPageCount()]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* 🔍 Barra de Filtros */}
      <div className="flex items-center gap-2 py-4">
        <Input
          placeholder="Buscar por nome ou CPF..."
          value={table.getColumn("nome")?.getFilterValue() ?? ""}
          onChange={(event) =>
            table.getColumn("nome")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <Select
          onValueChange={(value) =>
            table.getColumn("status_conta")?.setFilterValue(value === "todos" ? "" : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Situação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as Situações</SelectItem>
            <SelectItem value="Em Dia">Em Dia</SelectItem>
            <SelectItem value="Atrasado">Atrasado</SelectItem>
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-10 px-2 lg:px-3"
          >
            Limpar Filtros
            <XCircle className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 📋 Tabela de Clientes */}
      <div className="crediario-table-container flex-grow rounded-md border overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {flexRender(
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
                  className="cursor-pointer select-none"
                  onClick={() => {
                    table.resetRowSelection() // limpa tudo
                    row.toggleSelected(true)  // marca apenas essa
                  }}
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground truncate">
          {Object.keys(rowSelection).length} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>

        <div className="flex flex-1 justify-center">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); table.previousPage(); }} disabled={!table.getCanPreviousPage()}>
                  Anterior
                </PaginationPrevious>
              </PaginationItem>
              {paginationRange.map((pageNumber, index) => {
                if (pageNumber === DOTS) { return <PaginationItem key={`dots-${index}`}><PaginationEllipsis /></PaginationItem>; }
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink href="#" onClick={(e) => { e.preventDefault(); table.setPageIndex(pageNumber - 1); }} isActive={currentPage === pageNumber}>
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { 
                    e.preventDefault(); 
                    // ✅ ADICIONE ESTA VERIFICAÇÃO EXTRA:
                    if (table.getCanNextPage()) { 
                      table.nextPage(); 
                    } else {
                      // Log opcional para confirmar que a barreira funcionou
                      console.log("Bloqueado: Tentativa de avançar além da última página.");
                    }
                  }}
                  // O disabled continua aqui, como estava
                  disabled={!table.getCanNextPage()} 
                >
                  Próximo
                </PaginationNext>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      <div className="flex-1" />
    </div>
  </div>
  )
}

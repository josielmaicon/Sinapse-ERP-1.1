// src/components/fiscal/FiscalDataTable.jsx

"use client"

import * as React from "react"
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationLink, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination"

// Helper para criar o range de paginação inteligente
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


// Supondo uma meta definida no componente pai
const META_DE_EMISSAO = 400000;

export default function FiscalDataTable({ columns, data }) {
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

  const numSelected = Object.keys(rowSelection).length;
  const selectedRowsData = table.getFilteredSelectedRowModel().rows.map(row => row.original);
  
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const paginationRange = usePaginationRange({
    totalPageCount: totalPages,
    currentPage,
  });

  const handleEmitSelected = () => {
    const totalToIssue = selectedRowsData.reduce((acc, row) => acc + row.saleValue, 0);
    const totalAlreadyIssued = data.filter(d => d.status === 'emitida').reduce((acc, row) => acc + row.saleValue, 0);
    
    if (totalAlreadyIssued + totalToIssue > META_DE_EMISSAO) {
      if (!confirm(`Atenção: A emissão de ${totalToIssue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} irá ultrapassar sua meta de ${META_DE_EMISSAO.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}. Deseja continuar?`)) {
        return;
      }
    }
    alert(`Emitindo ${numSelected} nota(s) selecionada(s)...`);
  };

  const handleEmitAllPending = () => {
    const pendingSales = data.filter(d => d.status === 'pendente');
    if (pendingSales.length === 0) {
      alert("Não há notas pendentes para emitir.");
      return;
    }
    const totalToIssue = pendingSales.reduce((acc, row) => acc + row.saleValue, 0);
    const totalAlreadyIssued = data.filter(d => d.status === 'emitida').reduce((acc, row) => acc + row.saleValue, 0);

    if (totalAlreadyIssued + totalToIssue > META_DE_EMISSAO) {
      if (!confirm(`Atenção: A emissão de ${totalToIssue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} irá ultrapassar sua meta. Deseja continuar?`)) {
        return;
      }
    }
    alert(`Emitindo todas as ${pendingSales.length} notas pendentes...`);
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Barra de Ferramentas */}
      <div className="flex items-center gap-4 py-4">
        <Input
          placeholder="Buscar por Nº da Nota..."
          value={(table.getColumn("nfNumber")?.getFilterValue()) ?? ""}
          onChange={(event) => table.getColumn("nfNumber")?.setFilterValue(event.target.value)}
          className="max-w-fit"
        />
        <Select onValueChange={(value) => table.getColumn("status")?.setFilterValue(value === 'todos' ? '' : value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="emitida">Emitidas</SelectItem>
            <SelectItem value="rejeitada">Rejeitadas</SelectItem>
            <SelectItem value="nao_declarar">Não Declarar</SelectItem>
          </SelectContent>
        </Select>
        {/* Aqui entraria um Date Picker para o filtro de data */}

        {/* Botões de Ação em Massa */}
        <div className="ml-auto flex items-center gap-2">
          {numSelected > 0 ? (
            <Button onClick={handleEmitSelected}>Emitir {numSelected} Selecionada(s)</Button>
          ) : (
            <Button onClick={handleEmitAllPending} className="min-h-0 min-w-0">Emitir Todas Pendentes</Button>
          )}
        </div>
      </div>

      <div className="flex-grow rounded-md border overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
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
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
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

      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {numSelected} de {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="flex-1">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); table.previousPage(); }}
                  disabled={!table.getCanPreviousPage()}
                >
                    Anterior
                </PaginationPrevious>
              </PaginationItem>
              {paginationRange.map((pageNumber, index) => {
                if (pageNumber === DOTS) {
                  return <PaginationItem key={`dots-${index}`}><PaginationEllipsis /></PaginationItem>;
                }
                return (
                  <PaginationItem key={pageNumber}>
                    <PaginationLink 
                      href="#" 
                      onClick={(e) => { e.preventDefault(); table.setPageIndex(pageNumber - 1); }}
                      isActive={currentPage === pageNumber}
                    >
                      {pageNumber}
                    </PaginationLink>
                  </PaginationItem>
                );
              })}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => { e.preventDefault(); table.nextPage(); }}
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
  );
}
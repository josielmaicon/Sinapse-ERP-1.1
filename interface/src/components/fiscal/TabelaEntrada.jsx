"use client"

import * as React from "react"
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// Removidos Select, toast, Loader2 por enquanto
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationLink, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination"

// const API_URL = "http://localhost:8000"; // Desnecessário aqui por enquanto

export default function NotaEntradaDataTable({ columns, data, refetchData }) { // Props mais simples
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [rowSelection, setRowSelection] = React.useState({});

  
  const DOTS = '...';
  const usePaginationRange = ({ totalPageCount, siblingCount = 1, currentPage }) => {
    // Copie exatamente o mesmo código do hook que está em FiscalDataTable.jsx
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
    // meta: {} // Vazio por enquanto, sem ações complexas
  });

  const numSelected = Object.keys(rowSelection).length;
  // const selectedRowsData = table.getFilteredSelectedRowModel().rows.map(row => row.original); // Desnecessário por enquanto

  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const paginationRange = usePaginationRange({ // Usa o hook importado/definido
    totalPageCount: totalPages,
    currentPage,
  });

  // Funções de ação em lote (placeholders)
  const handleActionLote = (action) => {
    const selectedIds = table.getFilteredSelectedRowModel().rows.map(row => row.original.id);
    if(selectedIds.length === 0) {
        alert("Nenhuma nota selecionada.");
        return;
    }
    alert(`Ação "${action}" para ${selectedIds.length} nota(s) de entrada selecionada(s): ${selectedIds.join(', ')}`);
    // Aqui viria a chamada de API para ações em lote (ex: marcar várias como conferidas)
  }


  // Dentro do componente NotaEntradaDataTable, antes do return
  React.useEffect(() => {
      if (table) { // Garante que a tabela já foi inicializada
          const paginationState = table.getState().pagination;
          console.log(
              `Página Atual: ${paginationState.pageIndex + 1}`, 
              `Total Páginas: ${table.getPageCount()}`, 
              `Pode ir para Próxima? ${table.getCanNextPage()}`
          );
      }
  // Adiciona dependências para rodar quando a página mudar
  }, [table, table?.getState().pagination.pageIndex, table?.getPageCount()]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Barra de Ferramentas Simplificada */}
      <div className="flex items-center gap-4 py-4">
        <Input
          placeholder="Buscar por Nº ou Chave..."
          // Filtro combinado simples (pode ser melhorado)
          // ✅ Correção: Removemos o 'as string'
          value={table.getColumn("numero_nota")?.getFilterValue() ?? ""} 
          onChange={(event) => {
             table.getColumn("numero_nota")?.setFilterValue(event.target.value);
             // Se quiser filtrar na chave também:
             // table.getColumn("chave_acesso")?.setFilterValue(event.target.value); 
          }}
          className="max-w-xs"
        />
        {/* Adicionar Filtro por Fornecedor ou Data aqui no futuro */}

        {/* Botões de Ação em Massa (Exemplo) */}
        <div className="ml-auto flex items-center gap-2">
           <Button 
             onClick={() => handleActionLote("Marcar como Conferida")} 
             disabled={numSelected === 0}
            >
              Marcar Selecionada(s) como Conferida(s)
            </Button>
           {/* Outros botões de lote podem vir aqui */}
        </div>
      </div>

      {/* Tabela (Estrutura igual à FiscalDataTable) */}
      <div className="flex-grow rounded-md border overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
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
                  // Adicionar onClick para selecionar/desslecionar se necessário
                  // onClick={() => row.toggleSelected()} 
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
                  Nenhuma nota de entrada encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginação e Contagem (Estrutura igual à FiscalDataTable) */}
      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {numSelected} de {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="flex-1">
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
  );
}
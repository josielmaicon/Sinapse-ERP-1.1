// src/components/fiscal/FiscalDataTable.jsx

"use client"
import { cn } from "@/lib/utils"
import * as React from "react"
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationLink, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination"
import { toast } from "sonner"
import { Loader2,
    FilePlus, // Para Não Geradas
    RefreshCw, // Para Pendentes
    AlertTriangle // Para Rejeitadas
} from "lucide-react"
import { ButtonGroup } from "@/components/ui/button-group"

const API_URL = "http://localhost:8000";
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

export default function FiscalDataTable({ columns, data, refetchData, batchLoadingType, onBatchAction}) {
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [sendingIds, setSendingIds] = React.useState(new Set());

const handleEmitSingleNote = async (notaId) => { // Recebe o ID da NOTA, não da venda (veja abaixo)
    if (sendingIds.has(notaId)) return; 

    setSendingIds(prev => new Set(prev).add(notaId)); 

    // URL CORRIGIDA: /fiscal/notas/{id}/transmitir
    const apiPromise = fetch(`${API_URL}/fiscal/notas/${notaId}/transmitir`, { 
      method: 'POST',
    })
    .then(async (response) => {
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.detail || `Erro ao emitir nota ${notaId}`);
      }
      
      // Verifica se o backend retornou sucesso ou rejeição lógica
      if (result.status === 'rejeitada') {
          throw new Error(result.mensagem || "Nota rejeitada pela SEFAZ");
      }
      
      return result; 
    });
  
    toast.promise(apiPromise, {
      loading: `Transmitindo Nota #${notaId} para a SEFAZ...`,
      success: (result) => {
        refetchData(false); 
        return `Sucesso! ${result.mensagem}`; 
      },
      error: (err) => {
          refetchData(false); // Recarrega para mostrar o status vermelho
          return `Falha: ${err.message}`;
      }, 
      finally: () => {
        setSendingIds(prev => {
          const next = new Set(prev);
          next.delete(notaId);
          return next;
        });
      }
    });
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
    meta: { sendingIds, handleEmitSingleNote }
  });

  const numSelected = Object.keys(rowSelection).length;
  const selectedRowsData = table.getFilteredSelectedRowModel().rows.map(row => row.original);
  
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const paginationRange = usePaginationRange({
    totalPageCount: totalPages,
    currentPage,
  });

    React.useEffect(() => {
        if (table) { // Garante que a tabela já foi inicializada
            const paginationState = table.getState().pagination;

        }
    }, [table, table?.getState().pagination.pageIndex, table?.getPageCount()]);

  return (
    <div className="w-full h-full flex flex-col">
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

          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-medium text-muted-foreground hidden sm:inline-block">
                Reenviar:
            </span>
              <ButtonGroup>
                <Button 
                    variant="outline" 
                    className="rounded-r-none focus:z-10" // Remove borda direita arredondada
                    onClick={() => onBatchAction('nao_geradas')} // Chama o Pai
                    disabled={batchLoadingType !== null}
                    title="Gerar notas para vendas que ficaram sem registro"
                >
                    {/* Lógica do Ícone/Spinner */}
                    {batchLoadingType === 'nao_geradas' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <FilePlus className="mr-2 h-4 w-4 text-muted-foreground" />
                    )}
                    Faltantes
                </Button>

                {/* 2. Pendentes */}
                <Button 
                    variant="outline" 
                    className="rounded-none focus:z-10 border-l-0" // Quadrado, sem borda esquerda
                    onClick={() => onBatchAction('pendentes')}
                    disabled={batchLoadingType !== null}
                    title="Tentar retransmitir notas paradas"
                >
                    {batchLoadingType === 'pendentes' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <RefreshCw className="mr-2 h-4 w-4 text-blue-600" />
                    )}
                    Pendentes
                </Button>
                
                {/* 3. Rejeitadas */}
                <Button 
                    variant="outline" 
                    className="rounded-l-none focus:z-10 border-l-0" // Remove borda esquerda arredondada
                    onClick={() => onBatchAction('rejeitadas')}
                    disabled={batchLoadingType !== null}
                    title="Retentar envio de notas com erro"
                >
                    {batchLoadingType === 'rejeitadas' ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <AlertTriangle className="mr-2 h-4 w-4 text-amber-600" />
                    )}
                    Rejeitadas
                </Button>
              </ButtonGroup>
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
        <div className="flex-1 text-sm text-muted-foreground truncate">
          {numSelected} de {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
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
  );
}
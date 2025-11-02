// src/components/fiscal/FiscalDataTable.jsx

"use client"

import * as React from "react"
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationLink, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination"
import { toast } from "sonner"
import { Loader2 } from "lucide-react";

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

export default function FiscalDataTable({ columns, data, refetchData, fiscalConfig, totalPurchased }) {
  const [sorting, setSorting] = React.useState([]);
  const [columnFilters, setColumnFilters] = React.useState([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [sendingIds, setSendingIds] = React.useState(new Set());
  const [isBatchLoading, setIsBatchLoading] = React.useState(false);

  const calculateCurrentGoal = () => {
    if (!fiscalConfig || totalPurchased === undefined) return 0; // Retorna 0 se dados não carregaram
    
    let goal = 0;
    const numericGoalValue = fiscalConfig.goal_value || 0;
    switch (fiscalConfig.strategy) {
      case "coeficiente": goal = totalPurchased * numericGoalValue; break;
      case "porcentagem": goal = totalPurchased * (1 + numericGoalValue / 100); break;
      case "valor_fixo": goal = numericGoalValue; break;
      default: goal = 0;
    }
    return goal;
  };

  // ✅ FUNÇÃO AUXILIAR para calcular o total já emitido (baseado nos dados da tabela)
  const calculateTotalIssued = () => {
    // Usa a mesma lógica do backend/frontend para status final
    return data.reduce((acc, venda) => {
        const statusSefaz = venda.nota_fiscal_saida?.status_sefaz?.toLowerCase();
        if (statusSefaz === 'autorizada' || statusSefaz === 'emitida') {
            return acc + (venda.valor_total || 0);
        }
        return acc;
    }, 0);
  }

  const handleEmitSingleNote = async (vendaId) => {
    if (sendingIds.has(vendaId)) return; // Já está enviando, não faz nada

    setSendingIds(prev => new Set(prev).add(vendaId)); // Adiciona ao Set (imutável)

    const apiPromise = fetch(`${API_URL}/fiscal/emitir/${vendaId}`, { // ✅ Chamada para NOVA ROTA
      method: 'POST',
      // Headers e Body se necessários (ex: token de autenticação)
    })
    .then(async (response) => {
      // Mesmo se der erro na API, precisamos limpar o estado 'sendingIds'
      const result = await response.json().catch(() => ({})); // Tenta pegar JSON, senão objeto vazio
      if (!response.ok) {
        // Tenta pegar 'detail' do erro FastAPI, senão mensagem genérica
        throw new Error(result.detail || `Erro ${response.status} ao emitir nota ${vendaId}`);
      }
      return result; // Retorna os dados de sucesso (pode ser o status atualizado)
    });
  
    toast.promise(apiPromise, {
      loading: `Enviando NFe para venda ID ${vendaId}...`,
      success: (result) => {
        // Chamada SÍNCRONA, não precisa de await aqui
        refetchData(false); // Recarrega os dados da tabela SEM piscar a página
        // A mensagem pode vir do backend ou ser fixa
        return `NFe para venda ID ${vendaId} processada com status: ${result.status_sefaz || result.status || 'OK'}`; 
      },
      error: (err) => err.message, // Mostra a mensagem de erro da API
      finally: () => {
        // SEMPRE remove o ID do Set, no sucesso ou erro
        setSendingIds(prev => {
          const next = new Set(prev);
          next.delete(vendaId);
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

  const handleEmitSelected = () => {
    if (isBatchLoading) return; // Não faz nada se já estiver processando um lote
    if (selectedRowsData.length === 0) {
      toast.info("Nenhuma nota selecionada para emitir.");
      return;
    }
    
    // Pega apenas os IDs das linhas selecionadas
    const idsToEmit = selectedRowsData.map(row => row.id);
    
    // Lógica de verificação da meta (AGORA USA DADOS DINÂMICOS)
    const calculatedGoal = calculateCurrentGoal();
    const totalIssued = calculateTotalIssued();
    // Soma apenas o valor das vendas selecionadas (usa valor_total que vem da API)
    const totalToIssue = selectedRowsData.reduce((acc, row) => acc + (row.valor_total || 0), 0);
    
    // Verifica se a emissão ultrapassará a meta (se houver meta e não for piloto automático)
    if (calculatedGoal > 0 && !fiscalConfig?.autopilot_enabled && (totalIssued + totalToIssue > calculatedGoal)) {
      if (!confirm(`Atenção: A emissão de ${totalToIssue.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})} irá ultrapassar sua meta de ${calculatedGoal.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}. Deseja continuar?`)) {
        return; // Usuário cancelou
      }
    }
    
    // Chama a API de lote
    setIsBatchLoading(true);
    const apiPromise = fetch(`${API_URL}/fiscal/emitir/lote`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venda_ids: idsToEmit })
    })
    .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.detail || "Erro ao emitir notas selecionadas.");
        }
        return result; 
    });
    
    toast.promise(apiPromise, {
        loading: `Enviando ${idsToEmit.length} nota(s) selecionada(s) para emissão...`,
        success: (result) => {
            refetchData(false); // Recarrega dados
            table.resetRowSelection(); // Limpa seleção
            return result.message; // Mostra msg do backend
        },
        error: (err) => err.message, 
        finally: () => {
            setIsBatchLoading(false); // Libera o loading do lote
        }
    });
  };

  const handleEmitAllPending = () => {
   if (isBatchLoading) return; 
  
   // NÃO precisamos filtrar aqui, o backend fará a lógica correta
   // const pendingSales = data.filter(d => ...); 
   
   // AVISO: A verificação de META aqui é complexa, pois não sabemos AINDA
   // quais notas o backend VAI selecionar. Idealmente, o backend deveria
   // retornar um AVISO se a emissão ultrapassou a meta, ou ter um parâmetro
   // na API tipo "?ignorar_meta=true".
   // Por simplicidade, vamos remover a confirmação de meta daqui por enquanto,
   // confiando que o usuário sabe o que está fazendo ao clicar em "Emitir Todas".
   
   // if (totalAlreadyIssued + totalToIssue > calculatedGoal) { ... } // REMOVIDO
  
   // Chama a API de emitir todas as pendentes
   setIsBatchLoading(true);
   const apiPromise = fetch(`${API_URL}/fiscal/emitir/pendentes`, { 
       method: 'POST',
   })
   .then(async (response) => {
       const result = await response.json();
       if (!response.ok) {
           throw new Error(result.detail || "Erro ao emitir todas as notas pendentes.");
       }
       return result; 
   });
  
   toast.promise(apiPromise, {
       loading: `Solicitando emissão de todas as notas pendentes...`,
       success: (result) => {
           refetchData(false); 
           return result.message; 
       },
       error: (err) => err.message, 
       finally: () => {
           setIsBatchLoading(false); 
       }
   });
  };

    // Dentro do componente NotaEntradaDataTable, antes do return
    React.useEffect(() => {
        if (table) { // Garante que a tabela já foi inicializada
            const paginationState = table.getState().pagination;

        }
    // Adiciona dependências para rodar quando a página mudar
    }, [table, table?.getState().pagination.pageIndex, table?.getPageCount()]);

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
            // ✅ Botão agora desabilitado se um lote estiver carregando
            <Button onClick={handleEmitSelected} disabled={isBatchLoading}>
              {isBatchLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
              Emitir {numSelected} Selecionada(s)
            </Button>
          ) : (
            // ✅ Botão agora desabilitado se um lote estiver carregando
            <Button onClick={handleEmitAllPending} className="min-h-0 min-w-0" disabled={isBatchLoading}>
              {isBatchLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Emitir Todas Pendentes
            </Button>
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
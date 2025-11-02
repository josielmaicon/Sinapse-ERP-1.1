// src/components/pdvs/PdvDataTable.jsx

"use client"

import * as React from "react"
import { Power, PowerOff, Pause, DollarSign, HandCoins, ExternalLink, Loader2 } from "lucide-react"
import { useReactTable, getCoreRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationLink, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "@/components/ui/pagination"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useNavigate } from "react-router-dom";
import { OpenClosePdvModal } from "./modalAberturaFechamento"
import { toast } from "sonner"

// Importe as colunas
import { pdvColumns } from "./ColunasPDV"
import { operatorColumns } from "./ColunasOPR"

// SIMULAÇÃO: Identificador do computador/PDV atual
const CURRENT_MACHINE_PDV_ID = "Caixa 02";
const API_URL = "http://localhost:8000";

export function PdvDataTable({ data: pdvsData, operatorData, onPdvSelect, refetchData }) {
    const [viewMode, setViewMode] = React.useState("pdvs");
    const [sorting, setSorting] = React.useState([]);
    const [selectedRow, setSelectedRow] = React.useState(null);
    const [isTogglingStatus, setIsTogglingStatus] = React.useState(false);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [modalActionType, setModalActionType] = React.useState(null);
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

    // Função para lidar com o clique na linha
    const handleRowClick = (row) => {
        const newSelectedRow = selectedRow?.id === row.original.id ? null : row.original;
        setSelectedRow(newSelectedRow);
        
        if (onPdvSelect) {
            onPdvSelect(viewMode === "pdvs" ? newSelectedRow : null);
        }
    }
    
    const handleTogglePdvStatus = async () => {
      if (!selectedRow || isTogglingStatus) return; // Não faz nada se já estiver carregando

      setIsTogglingStatus(true);
      const pdvId = selectedRow.id;
      const currentStatus = selectedRow.status;
      const actionText = currentStatus === 'aberto' ? "Fechando" : "Abrindo";

      const operadorId = 1; 

      const apiPromise = fetch(`${API_URL}/pdvs/${pdvId}/toggle-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operador_id: operadorId }) 
      })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.detail || `Erro ao ${actionText.toLowerCase()} o caixa`);
        }
        return result;
      });

      toast.promise(apiPromise, {
        loading: `${actionText} caixa ${selectedRow.nome}...`,
        success: (updatedPdv) => {
          refetchData();
          return `Caixa ${updatedPdv.nome} ${updatedPdv.status === 'aberto' ? 'aberto' : 'fechado'} com sucesso!`;
        },
        error: (err) => err.message,
        finally: () => setIsTogglingStatus(false) // ✅ Finaliza o loading
      });
    };


    const isCurrentMachineSelected = viewMode === "pdvs" && selectedRow?.nome === CURRENT_MACHINE_PDV_ID;
    const numSelected = selectedRow ? 1 : 0;
    const buttonsDisabled = viewMode === "operadores" || numSelected === 0;
    const isPdvOpen = selectedRow?.status === 'aberto';

    const ToggleIcon = isPdvOpen ? PowerOff : Power; // Escolhe o ícone correto
    const toggleButtonTooltip = isPdvOpen ? "Fechar Caixa" : "Abrir Caixa";
    
    const handleOpenInterface = () => {
        if (!isCurrentMachineSelected) {
            toast.error("Ação inválida", { description: "Você só pode abrir a interface do PDV desta máquina."});
            return;
        }
        localStorage.setItem('ACTIVE_PDV_NAME', selectedRow.nome);
        console.log(`Definindo PDV Ativo (Nome: ${selectedRow.nome}) e navegando...`);
      
      navigate("/pontovenda");
    };
            
    
    const handleOpenModal = () => {
      if (!selectedRow) return;
      const action = selectedRow.status === 'aberto' ? 'close' : 'open';
      setModalActionType(action);
      setIsModalOpen(true);
    }

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
    // Adiciona dependências para rodar quando a página mudar
    }, [table, table?.getState().pagination.pageIndex, table?.getPageCount()]);

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

                {/* BOTÕES DE AÇÃO */}
                <div className="flex-shrink-0 flex items-center justify-end gap-2 mt-2">
                  {isCurrentMachineSelected && (
                    <Button size="sm" onClick={handleOpenInterface}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Abrir Interface
                    </Button>
                  )}

                   <Tooltip>
                     <TooltipTrigger asChild>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         // Desabilita se for operador OU se não houver seleção OU se estiver carregando
                         disabled={buttonsDisabled} 
                         onClick={handleOpenModal}
                       >
                        <ToggleIcon className="h-4 w-4" />
                       </Button>
                     </TooltipTrigger>
                     <TooltipContent>
                       <p>{toggleButtonTooltip}</p>
                     </TooltipContent>
                   </Tooltip>

                  <Button variant="outline" size="sm" disabled={buttonsDisabled} onClick={() => handleAction("Pausar")}>
                    <Pause className="h-4 w-4" />
                  </Button>
                  <Button variant="secondary" size="sm" disabled={buttonsDisabled} onClick={() => handleAction("Sangria")}>
                    <HandCoins className="h-4 w-4" />
                  </Button>
                </div>
            </div>

          <OpenClosePdvModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            actionType={modalActionType}
            pdv={selectedRow}
            refetchData={refetchData}
            // Passamos a lista de operadores que a PdvDataTable já recebe
            operators={operatorData.filter(op => op.status === 'ativo')} 
          />
        </TooltipProvider>
    );
}
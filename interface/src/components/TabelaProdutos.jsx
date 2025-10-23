// src/components/products/data-table.jsx

"use client"

import * as React from "react"
import { ChevronDown, Filter, PlusCircle, Tag, TrendingUp, Edit, Trash2 } from "lucide-react"
import { Separator } from "@/components/ui/separator" // Importe o Separator
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarTrigger } from "@/components/ui/menubar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious, PaginationEllipsis } from "@/components/ui/pagination"
import { ProductForm } from "./FormularioCadastroProduto"

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

export function ProductDataTable({ columns, data, onProductSelect, refetchData }) {
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState({})
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [productsToDelete, setProductsToDelete] = React.useState([]);

  // Função para "armar" o modal de exclusão
  const triggerDelete = (products) => {
    setProductsToDelete(products);
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
    onColumnVisibilityChange: setColumnVisibility,
    state: { sorting, columnFilters, rowSelection, columnVisibility },
    meta: {
      triggerDelete, // Passa a função para as colunas
    },
  })

  const numSelected = Object.keys(rowSelection).length;
  const canEdit = numSelected === 1;
  const canActOnSelection = numSelected > 0;

  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(data.map(item => item.category).filter(Boolean));
    return ["Todas", ...Array.from(uniqueCategories)];
  }, [data]);
  
  const currentPage = table.getState().pagination.pageIndex + 1;
  const totalPages = table.getPageCount();
  const paginationRange = usePaginationRange({
    totalPageCount: totalPages,
    currentPage,
  });

  React.useEffect(() => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (onProductSelect) {
      onProductSelect(selectedRows.length === 1 ? selectedRows[0].original : null);
    }
  }, [rowSelection, table, onProductSelect]);

  const handleAction = (action) => {
    if (action === "Novo Produto") {
      setIsModalOpen(true);
    } else if (action === "Excluir") {
      const selectedProducts = table.getFilteredSelectedRowModel().rows.map(row => row.original);
      triggerDelete(selectedProducts);
    } else {
      alert(`Ação: ${action}`);
    }
  };

  const handleFilter = (filter) => { alert(`Filtro selecionado: ${filter}`) };

  const onConfirmDelete = async () => {
    if (productsToDelete.length === 0) return;
    try {
      for (const product of productsToDelete) {
        console.log(`Simulando exclusão do produto ID: ${product.id}`);
        // Lógica real da API:
        // const response = await fetch(`http://localhost:8000/api/produtos/${product.id}`, { method: 'DELETE' });
        // if (!response.ok) throw new Error(`Falha ao excluir ${product.nome}`);
      }
      toast.success(`${productsToDelete.length} produto(s) excluído(s) com sucesso.`);
      setProductsToDelete([]);
      table.resetRowSelection();
      refetchData();
    } catch (error) {
      toast.error("Erro ao excluir", { description: error.message });
      setProductsToDelete([]);
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col items-start gap-4 py-2">
        <Menubar className="rounded-md flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(true)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Produto
            </Button>

            <Separator orientation="vertical" className="h-6" />

            <Button variant="ghost" size="sm" disabled={!canActOnSelection} onClick={() => alert("Gerando Etiquetas...")}>
              Gerar Etiqueta(s)
            </Button>
            <Button variant="ghost" size="sm" disabled={!canActOnSelection} onClick={() => alert("Criando Promoção...")}>
              Criar Promoção
            </Button>
            <Button variant="ghost" size="sm" disabled={!canActOnSelection} onClick={() => alert("Reajustando Preço...")}>
              Reajuste de Preço
            </Button>
            
            <Separator orientation="vertical" className="h-6" />

            <Button variant="ghost" size="sm" disabled={!canEdit} onClick={() => alert("Editando...")}>
              Editar
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              disabled={!canActOnSelection} 
              onClick={() => {
                const selectedProducts = table.getFilteredSelectedRowModel().rows.map(row => row.original);
                triggerDelete(selectedProducts);
              }}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir
            </Button>
          </Menubar>

        <div className="flex w-full items-center gap-2">
          <Input placeholder="Filtrar por nome..." value={(table.getColumn("nome")?.getFilterValue()) ?? ""} onChange={(event) => table.getColumn("nome")?.setFilterValue(event.target.value)} className="max-w-xs" />
          <Select onValueChange={(value) => { const filterValue = value === "Todas" ? "" : value; table.getColumn("categoria")?.setFilterValue(filterValue); }}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>{categories.map(category => (<SelectItem key={category} value={category}>{category}</SelectItem>))}</SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline"><Filter className="h-4 w-4 mr-2" />Filtros</Button></DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filtros Avançados</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => handleFilter("Vencidos")}>Vencidos</DropdownMenuItem>
              <DropdownMenuSub><DropdownMenuSubTrigger>Vão vencer</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onSelect={() => handleFilter("Vence em 7 dias")}>Nos próximos 7 dias</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleFilter("Vence em 15 dias")}>Nos próximos 15 dias</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => handleFilter("Vence em 30 dias")}>Nos próximos 30 dias</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onSelect={() => handleFilter("Adicionados Recentemente")}>Adicionados Recentemente</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="outline" className="ml-auto">Visualizar <ChevronDown className="ml-2 h-4 w-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end">{table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (<DropdownMenuCheckboxItem key={column.id} className="capitalize" checked={column.getIsVisible()} onCheckedChange={(value) => column.toggleVisibility(!!value)}>{column.id}</DropdownMenuCheckboxItem>))}</DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-grow rounded-md border overflow-y-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (<TableHead key={header.id}>{header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}</TableHead>))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"} className="cursor-pointer"
                  onClick={() => {
                    if (Object.keys(rowSelection).length > 1 || !row.getIsSelected()) {
                      table.resetRowSelection();
                      row.toggleSelected(true);
                    } else {
                      table.resetRowSelection();
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (<TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>))}
                </TableRow>
              ))
            ) : ( <TableRow><TableCell colSpan={columns.length} className="h-24 text-center">Nenhum resultado.</TableCell></TableRow> )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground">{Object.keys(rowSelection).length} de {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).</div>
        <div className="flex-1">
          <Pagination>
            <PaginationContent>
              <PaginationItem><PaginationPrevious href="#" onClick={(e) => { e.preventDefault(); table.previousPage(); }} disabled={!table.getCanPreviousPage()} isActive={table.getCanPreviousPage()}>Anterior</PaginationPrevious></PaginationItem>
              {paginationRange.map((pageNumber, index) => {
                if (pageNumber === DOTS) { return <PaginationItem key={`dots-${index}`}><PaginationEllipsis /></PaginationItem>; }
                return (<PaginationItem key={pageNumber}><PaginationLink href="#" onClick={(e) => { e.preventDefault(); table.setPageIndex(pageNumber - 1); }} isActive={currentPage === pageNumber}>{pageNumber}</PaginationLink></PaginationItem>);
              })}
              <PaginationItem><PaginationNext href="#" onClick={(e) => { e.preventDefault(); table.nextPage(); }} disabled={!table.getCanNextPage()} isActive={table.getCanNextPage()}>Próximo</PaginationNext></PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
        <div className="flex-1" />
      </div>

      <ProductForm open={isModalOpen} onOpenChange={setIsModalOpen} onProductCreated={refetchData} />

      <AlertDialog open={productsToDelete.length > 0} onOpenChange={(open) => !open && setProductsToDelete([])}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
              {productsToDelete.length === 1
                ? `Você está prestes a excluir o produto: "${productsToDelete[0]?.nome}".`
                : `Você está prestes a excluir ${productsToDelete.length} produtos.`
              } <br /> Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProductsToDelete([])}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onConfirmDelete} className="bg-destructive hover:bg-destructive/80">Sim, excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
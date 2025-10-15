// src/components/products/data-table.jsx

"use client"

import * as React from "react"
import { ChevronDown, Filter, Pencil, Trash2 } from "lucide-react"
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
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar"
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
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination"

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

export function ProductDataTable({ columns, data, onProductSelect }) {
  const [sorting, setSorting] = React.useState([])
  const [columnFilters, setColumnFilters] = React.useState([])
  const [rowSelection, setRowSelection] = React.useState({})
  const [columnVisibility, setColumnVisibility] = React.useState({})

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
  })

  const numSelected = Object.keys(rowSelection).length;
  const canEdit = numSelected === 1;
  const canActOnSelection = numSelected > 0;

  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(data.map(item => item.category));
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
      if (selectedRows.length === 1) {
        // Se UMA linha for selecionada, envia os dados dela para o pai
        onProductSelect(selectedRows[0].original);
      } else {
        // Se NENHUMA ou MAIS DE UMA for selecionada, envia 'null'
        onProductSelect(null);
      }
    }
  }, [rowSelection, table, onProductSelect]);

  const handleAction = (action) => { alert(`Ação: ${action}`) };
  const handleFilter = (filter) => { alert(`Filtro selecionado: ${filter}`) };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-col items-start gap-4 py-2">
        <Menubar className="rounded-md border">
          <MenubarMenu>
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => handleAction("Importar")}>Importar de Planilha...</MenubarItem>
              <MenubarItem onClick={() => handleAction("Exportar CSV")}>Exportar para CSV...</MenubarItem>
              <MenubarItem onClick={() => handleAction("Exportar PDF")}>Exportar para PDF...</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Produto</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => handleAction("Novo Produto")}>Novo Produto...</MenubarItem>
              <MenubarSeparator />
              <MenubarItem disabled={!canEdit} onClick={() => handleAction("Editar")}>Editar...</MenubarItem>
              <MenubarItem disabled={!canEdit} onClick={() => handleAction("Ver Histórico")}>Ver Histórico...</MenubarItem>
              <MenubarItem disabled={!canEdit} onClick={() => handleAction("Duplicar")}>Duplicar...</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Ações em Lote</MenubarTrigger>
            <MenubarContent>
              <MenubarItem disabled={!canActOnSelection} onClick={() => handleAction("Reajustar Preço")}>Reajustar Preço...</MenubarItem>
              <MenubarItem disabled={!canActOnSelection} onClick={() => handleAction("Criar Promoção")}>Criar Promoção...</MenubarItem>
              <MenubarItem disabled={!canActOnSelection} onClick={() => handleAction("Gerar Etiquetas")}>Gerar Etiqueta(s)</MenubarItem>
              <MenubarSeparator />
              <MenubarItem disabled={!canActOnSelection} className="text-red-500" onClick={() => handleAction("Excluir")}>Excluir Selecionado(s)</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        <div className="flex w-full items-center gap-2">
          <Input
            placeholder="Filtrar por nome..."
            value={(table.getColumn("name")?.getFilterValue()) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="max-w-xs"
          />
          <Select onValueChange={(value) => {
              const filterValue = value === "Todas" ? "" : value;
              table.getColumn("category")?.setFilterValue(filterValue);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (<SelectItem key={category} value={category}>{category}</SelectItem>))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Filtros Avançados</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => handleFilter("Vencidos")}>Vencidos</DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Vão vencer</DropdownMenuSubTrigger>
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
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
                Visualizar <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {table.getAllColumns().filter((column) => column.getCanHide()).map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ---- AQUI COMEÇA A TABELA PREENCHIDA ---- */}
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
                  onClick={() => row.toggleSelected()}
                  className="cursor-pointer"
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

      {/* ---- AQUI COMEÇA O FOOTER PREENCHIDO ---- */}
      <div className="flex items-center justify-between py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {Object.keys(rowSelection).length} de{" "}
          {table.getFilteredRowModel().rows.length} linha(s) selecionada(s).
        </div>
        <div className="flex-1">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => { e.preventDefault(); table.previousPage(); }}
                  disabled={!table.getCanPreviousPage()}
                  isActive={table.getCanPreviousPage()}
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
                  isActive={table.getCanNextPage()}
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
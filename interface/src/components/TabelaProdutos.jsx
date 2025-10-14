// src/components/products/data-table.jsx

"use client"

import * as React from "react"
import { ChevronDown, Pencil, Trash2 } from "lucide-react"
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
// ✅ 1. Importe os componentes da Menubar
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
} from "@/components/ui/pagination"

export function ProductDataTable({ columns, data }) {
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
    state: {
      sorting,
      columnFilters,
      rowSelection,
      columnVisibility,
    },
  })

  // ✅ 2. Lógica para controlar o estado dos menus com base na seleção
  const numSelected = Object.keys(rowSelection).length;
  const canEdit = numSelected === 1;
  const canActOnSelection = numSelected > 0;

  const categories = React.useMemo(() => {
    const uniqueCategories = new Set(data.map(item => item.category));
    return ["Todas", ...Array.from(uniqueCategories)];
  }, [data]);

  const handleAction = (action) => {
    alert(`Ação: ${action}`);
    // Futuramente, aqui você implementará a lógica de cada ação
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* ✅ 3. BARRA DE COMANDO COMPLETA (MENUBAR + FILTROS) */}
      <div className="flex flex-col gap-4 py-4">
        {/* ---- LINHA 1: MENUBAR ---- */}
        <Menubar className="rounded-md border">
          <MenubarMenu>
            <MenubarTrigger>Produto</MenubarTrigger>
            <MenubarContent>
              <MenubarItem onClick={() => handleAction("Novo Produto")}>Novo Produto...</MenubarItem>
              <MenubarSeparator />
              <MenubarItem disabled={!canEdit} onClick={() => handleAction("Editar")}>Editar</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Ações em Lote</MenubarTrigger>
            <MenubarContent>
              <MenubarItem disabled={!canActOnSelection} onClick={() => handleAction("Criar Promoção")}>Criar Promoção...</MenubarItem>
              <MenubarItem disabled={!canActOnSelection} onClick={() => handleAction("Gerar Etiquetas")}>Gerar Etiqueta(s)</MenubarItem>
              <MenubarSeparator />
              <MenubarItem disabled={!canActOnSelection} className="text-red-500" onClick={() => handleAction("Excluir")}>Excluir Selecionado(s)</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
          <MenubarMenu>
            <MenubarTrigger>Arquivo</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>Exportar para CSV...</MenubarItem>
            </MenubarContent>
          </MenubarMenu>
        </Menubar>

        {/* ---- LINHA 2: FILTROS ---- */}
        <div className="flex items-center gap-4">
          <Input
            placeholder="Filtrar por nome..."
            value={(table.getColumn("name")?.getFilterValue()) ?? ""}
            onChange={(event) => table.getColumn("name")?.setFilterValue(event.target.value)}
            className="max-w-xs"
          />
          <Select
            onValueChange={(value) => {
              const filterValue = value === "Todas" ? "" : value;
              table.getColumn("category")?.setFilterValue(filterValue);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(category => (<SelectItem key={category} value={category}>{category}</SelectItem>))}
            </SelectContent>
          </Select>
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

      <div className="flex items-center justify-between py-4">
        {/* ... O Footer continua igual, MAS OS BOTÕES DE AÇÃO FORAM REMOVIDOS DAQUI ... */}
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
          </Pagination></div>
        <div className="flex-1" /> {/* Div vazia para manter o alinhamento de 3 colunas */}
      </div>
    </div>
  )
}
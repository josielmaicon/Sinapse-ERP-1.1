// src/components/ui/MyTable.jsx
import { cn } from "@/lib/utils"

// A tabela em si. `border-collapse` é bom para o estilo das bordas.
const Table = ({ className, ...props }) => (
  <table className={cn("w-full border-collapse text-sm", className)} {...props} />
)

// O cabeçalho da tabela
const TableHeader = ({ className, ...props }) => (
  <thead className={cn(className)} {...props} />
)

// O corpo da tabela
const TableBody = ({ className, ...props }) => (
  <tbody className={cn("divide-y divide-border", className)} {...props} />
)

// A linha da tabela. Adicionamos um hover para um efeito visual.
const TableRow = ({ className, ...props }) => (
  <tr className={cn("hover:bg-muted/50 transition-colors", className)} {...props} />
)

// A CÉLULA DO CABEÇALHO - AQUI ESTÁ A MÁGICA DO STICKY
const TableHead = ({ className, ...props }) => (
  <th
    className={cn(
      "sticky top-0 z-10", // <-- A MÁGICA!
      "border-b border-border", // Borda para separar do conteúdo
      "bg-card px-4 py-3 text-left font-medium text-muted-foreground", // Estilos
      className
    )}
    {...props}
  />
)

// A célula comum da tabela
const TableCell = ({ className, ...props }) => (
  <td className={cn("px-4 py-3 align-middle", className)} {...props} />
)

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell }
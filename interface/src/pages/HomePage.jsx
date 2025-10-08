import HomePageLayout from "@/layouts/HomepageLayout"
import BarChart from "@/components/ui/bar-chart"
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/SimpleTable"

export default function HomePage() {
  // 🧩 MOCK: dados e colunas simuladas
  const columns = ["ID", "Nome", "Cargo", "Status"]
  const data = [
    { id: 1, nome: "Ana Paula", cargo: "Operadora", status: "Ativa" },
    { id: 2, nome: "Carlos Souza", cargo: "Supervisor", status: "Em férias" },
    { id: 3, nome: "Mariana Lima", cargo: "Financeiro", status: "Ativa" },
    { id: 4, nome: "Jorge Dias", cargo: "Operador", status: "Ativa" },
    { id: 5, nome: "Beatriz Costa", cargo: "RH", status: "Licença" },
    { id: 6, nome: "Fernando Alves", cargo: "Operador", status: "Ativa" },
    { id: 7, nome: "Lucas Martins", cargo: "Supervisor", status: "Ativo" },
    { id: 8, nome: "Patrícia Melo", cargo: "Financeiro", status: "Ativa" },
    { id: 9, nome: "Ricardo Gomes", cargo: "Operador", status: "Em treinamento" },
    { id: 10, nome: "Sofia Ribeiro", cargo: "Operadora", status: "Ativa" },
    { id: 1, nome: "Ana Paula", cargo: "Operadora", status: "Ativa" },
    { id: 2, nome: "Carlos Souza", cargo: "Supervisor", status: "Em férias" },
    { id: 3, nome: "Mariana Lima", cargo: "Financeiro", status: "Ativa" },
    { id: 4, nome: "Jorge Dias", cargo: "Operador", status: "Ativa" },
    { id: 5, nome: "Beatriz Costa", cargo: "RH", status: "Licença" },
    { id: 6, nome: "Fernando Alves", cargo: "Operador", status: "Ativa" },
    { id: 7, nome: "Lucas Martins", cargo: "Supervisor", status: "Ativo" },
    { id: 8, nome: "Patrícia Melo", cargo: "Financeiro", status: "Ativa" },
    { id: 9, nome: "Ricardo Gomes", cargo: "Operador", status: "Em treinamento" },
    { id: 10, nome: "Sofia Ribeiro", cargo: "Operadora", status: "Ativa" },
  ]

  return (
    <HomePageLayout
      TopRight={<div>Gráfico principal</div>}
      BottomLeft={<div>Gráfico 1</div>}
      BottomRight={<div>Gráfico 2</div>}
      SideTop={
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col}>{col}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.id}</TableCell>
                <TableCell>{item.nome}</TableCell>
                <TableCell>{item.cargo}</TableCell>
                <TableCell>{item.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      }
      SideBottom={<div>Status Operações</div>}
    />
  )
}

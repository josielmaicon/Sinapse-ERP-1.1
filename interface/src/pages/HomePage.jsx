import HomePageLayout from "@/layouts/HomepageLayout"
import BarChart from "@/components/ui/bar-chart"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function HomePage() {
  // 🧩 MOCK: dados e colunas simuladas
  const columns = ["Nome", "Cargo", "Status"]
  const data = [
    { nome: "Ana Paula", cargo: "Operadora", status: "Ativa" },
    { nome: "Carlos Souza", cargo: "Supervisor", status: "Em férias" },
    { nome: "Mariana Lima", cargo: "Financeiro", status: "Ativa" },
  ]

  return (
    <HomePageLayout
      TopRight={<BarChart />}
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
            {data.map((item, i) => (
              <TableRow key={i}>
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

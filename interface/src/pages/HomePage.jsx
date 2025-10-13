import HomePageLayout from "@/layouts/HomepageLayout"
import PdvRevenueChart from "@/components/PdvChart"

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
    { id: 11, nome: "Ana Paula", cargo: "Operadora", status: "Ativa" },
    { id: 12, nome: "Carlos Souza", cargo: "Supervisor", status: "Em férias" },
    { id: 13, nome: "Mariana Lima", cargo: "Financeiro", status: "Ativa" },
    { id: 14, nome: "Jorge Dias", cargo: "Operador", status: "Ativa" },
    { id: 15, nome: "Beatriz Costa", cargo: "RH", status: "Licença" },
    { id: 16, nome: "Fernando Alves", cargo: "Operador", status: "Ativa" },
    { id: 17, nome: "Lucas Martins", cargo: "Supervisor", status: "Ativo" },
    { id: 18, nome: "Patrícia Melo", cargo: "Financeiro", status: "Ativa" },
    { id: 19, nome: "Ricardo Gomes", cargo: "Operador", status: "Em treinamento" },
  ]

  return (
    <HomePageLayout
      // ✅ Substitua o componente aqui
      TopRight={<PdvRevenueChart/>}
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
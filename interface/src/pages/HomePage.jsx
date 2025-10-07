import HomePageLayout from "@/layouts/HomepageLayout"
import { Table } from "@/components/ui/table"
import { columns } from "@/data/columns"
import { data } from "@/data/data"

export default function HomePage() {
  return (
    <HomePageLayout
      TopRight={<Table columns={columns} data={data}  />}
      BottomLeft={<div>Gráfico 1</div>}
      BottomRight={<div>Gráfico 2</div>}
      SideTop={<div>Resumo Diário</div>}
      SideBottom={<div>Status Operações</div>}
    />
  );
}

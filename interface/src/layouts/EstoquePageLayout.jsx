import CardBody from "@/components/CardBody"

export default function EstoquePageLayout({ title, children }) { // Mudei para export nomeado para consistência
  return (
    <div className="flex-1 p-2 pt-0 flex flex-col">  
        <div className="flex-grow grid grid-cols-[0.6fr_0.4fr] gap-2">
                <CardBody title="Container" subtitle="Descrição do container"></CardBody>
                <CardBody title="Container" subtitle="Descrição do container"></CardBody>
        </div>
    </div>
  );
}
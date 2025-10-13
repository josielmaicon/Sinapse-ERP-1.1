import CardBody from "@/components/CardBody";
import CardInfo from "@/components/CardInfo";

export default function ProdutosPageLayout({ title, children, Card1, Card2, Card3, Card4, TabelaProdutos }) { // Mudei para export nomeado para consistência
  return (
    <div className="flex-1 p-2 pt-4 flex flex-col">  
        <div className="flex-grow grid grid-rows-[0.2fr_0.8fr] gap-2">
            <div className="flex-grow grid grid-cols-[1fr_1fr_1fr_1fr] gap-2">
                <CardInfo mainvalue="16,02%" description="Descrição do container" subvalue="+16%">{Card1}</CardInfo>
                <CardInfo mainvalue="16,02%" description="Descrição do container" subvalue="+16%">{Card2}</CardInfo>
                <CardInfo mainvalue="16,02%" description="Descrição do container" subvalue="+16%">{Card3}</CardInfo>
                <CardInfo mainvalue="16,02%" description="Descrição do container" subvalue="+16%">{Card4}</CardInfo>
            </div>
            <div className="flex-grow grid grid-cols-[2.5fr_1.5fr] gap-2">
                <CardBody title="Container" subtitle="Descrição do container">{TabelaProdutos}</CardBody>
            <div className="flex-grow grid grid-rows-[1fr_1fr] gap-2">
                <CardBody title="Container" subtitle="Descrição do container"></CardBody>
                <CardBody title="Container" subtitle="Descrição do container"></CardBody>
            </div>
            </div>
        </div>
    </div>
  );
}
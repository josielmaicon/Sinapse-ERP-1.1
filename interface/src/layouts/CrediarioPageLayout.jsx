import CardBody from "@/components/CardBody";
import CardBodyNoTitle from "@/components/CardBodyNoTitle";
import CardInfo from "@/components/CardInfo";

export default function CrediarioPageLayout({ Card1, Card2, Card3, TabelaCredito, PainelLateral1, PainelLateral2 }) { // Mudei para export nomeado para consistência
  return (
    <div className="flex-1 p-2 pt-4 flex flex-col">  
        <div className="flex-grow grid grid-rows-[0.2fr_0.8fr] gap-2">
            <div className="flex-grow grid grid-cols-[1fr_1fr_1fr] gap-2">
                <CardInfo mainvalue="R$ 21.183,25" description="Valor Total de Estoque" subvalue="">{Card1}</CardInfo>
                <CardInfo mainvalue="42" description="Itens com Estoque Baixo" subvalue="">{Card2}</CardInfo>
                <CardInfo mainvalue="12" description="Itens Próximos do Vencimento" subvalue="">{Card3}</CardInfo>
            </div>
            <div className="flex-grow grid grid-cols-[2.5fr_1.5fr] gap-2">
                <CardBody title="Container" subtitle="Descrição do container">{TabelaCredito}</CardBody>
            <div className="flex-grow grid grid-rows-[5fr_3fr] gap-2">
                <CardBodyNoTitle>{PainelLateral1}</CardBodyNoTitle>
                <CardBodyNoTitle>{PainelLateral2}</CardBodyNoTitle>
            </div>
            </div>
        </div>
    </div>
  );
}
import CardBody from "@/components/CardBody";
import CardBodyNoTitle from "@/components/CardBodyNoTitle";
import CardInfo from "@/components/CardInfo";

export default function CrediarioPageLayout({ 
  Card1_MainValue, Card1_Description, Card1_Children,
  Card2_MainValue, Card2_Description, Card2_Children,
  Card3_MainValue, Card3_Description, Card3_Children,
  TabelaCredito, 
  PainelLateral1 
}) {  return (
    <div className="flex-1 p-2 pt-4 flex flex-col">  
        <div className="flex-grow grid grid-rows-[0.2fr_0.8fr] gap-2">
            <div className="flex-grow grid grid-cols-[1fr_1fr_1fr] gap-2">
                <CardInfo mainvalue={Card1_MainValue} description={Card1_Description}>{Card1_Children}</CardInfo>
                <CardInfo mainvalue={Card2_MainValue} description={Card2_Description}>{Card2_Children}</CardInfo>
                <CardInfo mainvalue={Card3_MainValue} description={Card3_Description}>{Card3_Children}</CardInfo>
            </div>
            <div className="flex-grow grid grid-cols-[2.5fr_1.5fr] gap-2">
                <CardBody title="Container" subtitle="Descrição do container">{TabelaCredito}</CardBody>
                <CardBodyNoTitle className="client-detail-panel">{PainelLateral1}</CardBodyNoTitle>
            </div>
        </div>
    </div>
  );
}
import CardBody from "@/components/CardBody";
import CardInfo from "@/components/CardInfo";
import CardBodyNoTitle from "@/components/CardBodyNoTitle";

export default function ProdutosPageLayout({
Card1_MainValue, Card1_Description, Card1_Children,
Card2_MainValue, Card2_Description, Card2_Children,
Card3_MainValue, Card3_Description, Card3_Children,
Card4_MainValue, Card4_Description, Card4_Children,
TabelaProdutos, PainelLateral
}) {
  return (
    <div className="flex-1 p-2 pt-0 flex flex-col">  
        <div className="flex-grow grid grid-rows-[0.2fr_0.8fr] gap-2">
            <div className="flex-grow grid grid-cols-[1fr_1fr_1fr_1fr] gap-2">
                <CardInfo mainvalue={Card1_MainValue} description={Card1_Description}>{Card1_Children}</CardInfo>
                <CardInfo mainvalue={Card2_MainValue} description={Card2_Description}>{Card2_Children}</CardInfo>
                <CardInfo mainvalue={Card3_MainValue} description={Card3_Description}>{Card3_Children}</CardInfo>
                <CardInfo mainvalue={Card4_MainValue} description={Card4_Description}>{Card4_Children}</CardInfo>
            </div>
            <div className="flex-grow grid grid-cols-[2.5fr_1.5fr] gap-2">
                <CardBodyNoTitle title="Container" subtitle="Descrição do container">{TabelaProdutos}</CardBodyNoTitle>
                <CardBodyNoTitle title="Container" subtitle="Descrição do container">{PainelLateral}</CardBodyNoTitle>
            </div>
        </div>
    </div>
  );
}
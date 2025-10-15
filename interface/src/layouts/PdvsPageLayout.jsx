import CardBody from "@/components/CardBody"
import CardInfo from "@/components/CardInfo"
import CardBodyNoTitle from "@/components/CardBodyNoTitle";

export default function PdvsPageLayout({ HoldPrincipal, StatCard1, StatCard2, HistoricoVendas}) {
  return (
    <div className="flex-1 p-2 pt-4 flex flex-col">  
        <div className="flex-grow grid grid-cols-[1fr_2fr] gap-2">
            <div className="flex-grow grid grid-rows-[1fr_3fr] gap-2">
                <CardInfo mainvalue="16,02%" description="Descrição do container" subvalue="+16%"></CardInfo>
                <CardBody title="Container" subtitle="Descrição do container"></CardBody>
            </div>
        <div className="flex-grow grid grid-rows-[1fr_3fr] gap-2">
            <div className="flex-grow grid grid-cols-[1fr_1fr] gap-2">
                <CardInfo mainvalue="16,02%" description="Descrição do container" subvalue="+16%"></CardInfo>
                <CardInfo mainvalue="16,02%" description="Descrição do container" subvalue="+16%"></CardInfo>
            </div>
                <CardBodyNoTitle title="Container" subtitle="Descrição do container">
                    <div className="grid grid-cols-[2fr_1fr] gap-2 h-full min-h-0">
                        <div className="grid grid-rows-[3fr_1fr] gap-2 min-h-0">
                            <div className="rounded-md flex items-center justify-center">
                                {HoldPrincipal}
                            </div>
                            <div className="grid grid-cols-[1fr_1fr] gap-2 min-h-0">
                                <div className="bg-border rounded-md flex items-center justify-center">
                                    {StatCard1}
                                </div>
                                <div className="bg-border rounded-md flex items-center justify-center">
                                    {StatCard2}
                                </div>
                            </div>
                        </div>
                            <div className="border rounded-md flex items-center justify-center p-4">
                                {HistoricoVendas}
                            </div>
                    </div>
                </CardBodyNoTitle>
            </div>
        </div>
    </div>
  );
}
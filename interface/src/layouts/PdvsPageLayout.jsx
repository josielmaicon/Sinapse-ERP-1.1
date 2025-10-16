import CardBodyNoTitle from "@/components/CardBodyNoTitle";

export default function PdvsPageLayout({ HoldPrincipal, StatCard1, StatCard2, StatCard3, HistoricoVendas, ListaPDVs, StatCardInterno1, StatCardInterno2}) {
  return (
    <div className="flex-1 p-2 pt-4 flex flex-col">  
        <div className="flex-grow grid grid-cols-[1fr_2fr] gap-2">
            <div className="flex-grow grid grid-rows-[1fr_3fr] gap-2">
                <div>{StatCard1}</div>
                <CardBodyNoTitle title="Lista PDVs" subtitle="Descrição do container">{ListaPDVs}</CardBodyNoTitle>
            </div>
        <div className="flex-grow grid grid-rows-[1fr_3fr] gap-2">
            <div className="flex-grow grid grid-cols-[1fr_1fr] gap-2">
                <div>{StatCard2}</div>
                <div>{StatCard3}</div>
            </div>
                <CardBodyNoTitle title="Container" subtitle="Descrição do container">
                    <div className="grid grid-cols-[2fr_1fr] gap-2 h-full min-h-0">
                        <div className="grid grid-rows-[3fr_1fr] gap-2 min-h-0">
                            <div className="rounded-md flex items-center justify-center">
                                {HoldPrincipal}
                            </div>
                            <div className="grid grid-cols-[1fr_1fr] gap-2 min-h-0">
                                <div className="rounded-md flex items-center justify-center">
                                    {StatCardInterno1}
                                </div>
                                <div className="rounded-md flex items-center justify-center">
                                    {StatCardInterno2}
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
import CardBody from "@/components/CardBody"
import CardBodyNoTitle from "@/components/CardBodyNoTitle"

export default function FiscalPageLayout ({ TabelaFiscal, HistoricoEnvio, MetaEnvio }){
return (
    <div className="flex-1 p-2 pt-4 flex flex-col">  
        <div className="flex-grow grid grid-cols-[4fr_5fr] gap-2">
            <div className="flex-grow grid grid-rows-[1fr_1fr] gap-2">
                <CardBody title="Painel Fiscal" subtitle="Estratégia de emissão de notas">
                    {MetaEnvio || "Meta de Envio"}
                </CardBody>
                <CardBodyNoTitle>
                    {HistoricoEnvio || "Histórico"}
                </CardBodyNoTitle>
            </div>
          <CardBody title="Notas" subtitle="Detalhado por envio">
            {TabelaFiscal || "Tabela de notas"}
          </CardBody>
        </div>
    </div>
    )
}
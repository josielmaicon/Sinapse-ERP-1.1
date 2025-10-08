import CardBody from "@/components/CardBody"
import CardInfo from "@/components/CardInfo";

export default function PdvsPageLayout({ title, children }) {
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
            <CardBody title="Container" subtitle="Descrição do container"></CardBody>
            </div>
        </div>
    </div>
  );
}
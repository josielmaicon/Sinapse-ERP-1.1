export default function ProdutosPageLayout({ title, children }) { // Mudei para export nomeado para consistência
  return (
    <div className="flex-1 p-2 pt-4 flex flex-col">  
        <div className="flex-grow grid grid-rows-[0.2fr_0.8fr] gap-2">
            <div className="flex-grow grid grid-cols-[1fr_1fr_1fr_1fr] gap-2">
                <div className="bg-card p-6 rounded-lg border"></div>
                <div className="bg-card p-6 rounded-lg border"></div>
                <div className="bg-card p-6 rounded-lg border"></div>
                <div className="bg-card p-6 rounded-lg border"></div>
            </div>
            <div className="flex-grow grid grid-cols-[2.5fr_1.5fr] gap-2">
                <div className="bg-card p-6 rounded-lg border"></div>
            <div className="flex-grow grid grid-rows-[1fr_1fr] gap-2">
                <div className="bg-card p-6 rounded-lg border"></div>
                <div className="bg-card p-6 rounded-lg border"></div>
            </div>
            </div>
        </div>
    </div>
  );
}
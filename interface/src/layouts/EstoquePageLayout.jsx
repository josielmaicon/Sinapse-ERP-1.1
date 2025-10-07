export default function EstoquePageLayout({ title, children }) { // Mudei para export nomeado para consistência
  return (
    <div className="flex-1 p-2 pt-4 flex flex-col">  
        <div className="flex-grow grid grid-cols-[0.6fr_0.4fr] gap-2">
            <div className="bg-card p-6 rounded-lg border">
            </div>
            <div className="bg-card p-6 rounded-lg border">
            </div>
        </div>
    </div>
  );
}
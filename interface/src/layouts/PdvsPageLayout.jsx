export default function PdvsPageLayout({ title, children }) {
  return (
    <div className="flex-1 p-2 pt-4 flex flex-col">  
        <div className="flex-grow grid grid-cols-[1fr_2fr] gap-2">
            <div className="flex-grow grid grid-rows-[1fr_3fr] gap-2">
                <div className="bg-card p-6 rounded-lg border"></div>
                <div className="bg-card p-6 rounded-lg border"></div>
            </div>
        <div className="flex-grow grid grid-rows-[1fr_3fr] gap-2">
            <div className="flex-grow grid grid-cols-[1fr_1fr] gap-2">
                <div className="bg-card p-6 rounded-lg border"></div>
                    <div className="bg-card p-6 rounded-lg border"></div>
                </div>
                <div className="bg-card p-6 rounded-lg border"></div>
            </div>
        </div>
    </div>
  );
}
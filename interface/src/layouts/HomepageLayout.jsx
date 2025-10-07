export default function HomePageLayout({ 
  title, 
  TopRight, 
  BottomLeft, 
  BottomRight, 
  SideTop, 
  SideBottom 
}) {
  return (
    <div className="flex-1 p-2 pt-4 flex flex-col">
      <div className="flex-grow grid grid-cols-[0.6fr_0.4fr] gap-2">

        <div className="grid grid-rows-[0.6fr_0.4fr] gap-2">
          <div className="bg-card p-6 rounded-lg border">
            {TopRight}
          </div>

          <div className="grid grid-cols-[1fr_1fr] gap-2">
            <div className="bg-card p-6 rounded-lg border">
              {BottomLeft}
            </div>
            <div className="bg-card p-6 rounded-lg border">
              {BottomRight}
            </div>
          </div>
        </div>

        <div className="grid grid-rows-[1fr_1fr] gap-2">
          <div className="bg-card p-6 rounded-lg border">
            {SideTop}
          </div>
          <div className="bg-card p-6 rounded-lg border">
            {SideBottom}
          </div>
        </div>

      </div>
    </div>
  );
}

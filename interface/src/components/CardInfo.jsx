export default function CardInfo({ description, subvalue, children, mainvalue }) {
  return (
    <div className="bg-card p-4 pt-3 rounded-xl border flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div>
        {description && (<p className="text-sm text-muted-foreground ">{description}</p>)}
            <div className="flex items-center gap-2 mt-1">
                <h2 className="text-4xl font-bold tracking-tighter text-primary">{mainvalue}</h2>
                {subvalue && (
                <span className="text-lx text-base text-muted-foreground leading-none">
                    {subvalue}
                </span>
                )}
            </div>
        </div>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}


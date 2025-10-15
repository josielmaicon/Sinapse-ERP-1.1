export default function CardBody({ title, subtitle, children, onAction }) {
  return (
    <div className="bg-card p-6 pt-4 rounded-xl border flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground ">{subtitle}</p>
          )}
        </div>
      </div>

      <hr className="border-border mb-4" />

      {/* Conteúdo principal */}
      <div className="flex-1 relative min-h-0">{children}</div>
    </div>
  )
}

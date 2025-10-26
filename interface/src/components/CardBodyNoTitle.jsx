export default function CardBodyNoTitle({ children, className = "" }) {
  return (
    <div className="bg-card p-3 rounded-xl border flex flex-col">
      <div className={`flex-1 relative min-h-0 ${className}`}>{children}</div>
    </div>
  )
}

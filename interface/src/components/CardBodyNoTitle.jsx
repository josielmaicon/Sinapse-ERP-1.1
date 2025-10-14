export default function CardBodyNoTitle({ children }) {
  return (
    <div className="bg-card p-3 rounded-xl border flex flex-col">
      <div className="flex-1">{children}</div>
    </div>
  )
}

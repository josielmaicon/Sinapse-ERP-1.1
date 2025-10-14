export default function CardBodyNoTitle({ title, subtitle, children, onAction }) {
  return (
    <div className="bg-card p-6 pt-4 rounded-xl border flex flex-col">
      <div className="flex-1">{children}</div>
    </div>
  )
}

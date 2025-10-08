export default function ScrollableContainer({ children, className }) {
  return (
    <div className={`relative h-full overflow-y-auto ${className}`}>
      {children}
    </div>
  )
}
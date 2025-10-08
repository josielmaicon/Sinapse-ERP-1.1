import { ArrowUpRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function CardContainer({ title, subtitle, children, onAction }) {
  return (
    <div className="bg-card p-6 pt-4 rounded-xl border flex flex-col min-h-0">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground ">{subtitle}</p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onAction}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </div>

      <hr className="border-border mb-4" />

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto h-full min-h-0">{children}</div>
    </div>
  )
}

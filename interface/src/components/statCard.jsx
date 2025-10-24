// src/components/StatCard.jsx
import { Card } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function StatCard({ title, value, icon: Icon, isLoading, description }) {
  return (
    <Card className="h-full w-full flex flex-col items-center justify-center p-4 shadow-none ">
      
      <div className="flex items-center justify-center text-sm font-medium text-muted-foreground mb-2">
        {Icon && <Icon className="h-4 w-4 mr-2" />}
        <span>{title}</span>
      </div>
      <div className="text-center">
        <div className="text-4xl font-bold tracking-tighter text-primary">
          {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              ) : (
                <h2 className="text-4xl font-bold tracking-tighter text-primary">{value}</h2>
              )}
          </div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </div>

    </Card>
  )
}
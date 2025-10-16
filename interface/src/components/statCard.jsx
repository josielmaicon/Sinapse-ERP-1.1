// src/components/StatCard.jsx
import { Card } from "@/components/ui/card"

export default function StatCard({ title, value, icon: Icon, description }) {
  return (
    <Card className="h-full w-full flex flex-col items-center justify-center p-4 shadow-none ">
      
      <div className="flex items-center justify-center text-sm font-medium text-muted-foreground mb-2">
        {Icon && <Icon className="h-4 w-4 mr-2" />}
        <span>{title}</span>
      </div>
      <div className="text-center">
        <div className="text-6xl font-bold tracking-tighter">
          {value}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      </div>

    </Card>
  )
}
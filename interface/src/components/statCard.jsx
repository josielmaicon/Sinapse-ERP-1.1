// src/components/StatCard.jsx
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function StatCard({ title, value, icon: Icon, isLoading, description, subvalue, children }) {
  return (
    <Card className="h-full w-full p-4 pt-3 rounded-xl border flex flex-col shadow-none">
      
      {/* --- Linha superior: description + ícone --- */}
      <div className="flex items-center gap-2 mb-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        {title && <span className="text-sm text-muted-foreground">{title}</span>}
      </div>

      {/* --- Valor principal + subvalor --- */}
      <div className="flex items-center gap-2">
        {isLoading ? (
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        ) : (
          <h2 className="text-4xl font-bold tracking-tighter text-primary">{value}</h2>
        )}
        {subvalue && (
          <span className="text-base text-muted-foreground leading-none">{subvalue}</span>
        )}
      </div>

      {/* --- Área para children --- */}
      <div className="flex-grow relative mt-4 overflow-hidden">
        {children}
      </div>
    </Card>
  );
}

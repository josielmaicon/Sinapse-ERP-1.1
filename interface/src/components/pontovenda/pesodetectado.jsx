import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Scale, ScanBarcode } from "lucide-react";
import { cn } from "@/lib/utils";

export function WeightDetectedModal({ weight, onCancel }) {
  // O modal abre se 'weight' for diferente de null/0
  const isOpen = !!weight;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent 
        // Classes para deixar colorido e sem borda padrão
        className={cn(
            "sm:max-w-md border-0 shadow-2xl", 
            "bg-blue-600 text-white" // Cor de destaque (Azul)
        )}
        // Remove o botão de fechar padrão se quiser forçar o fluxo (opcional)
        // ou pode deixar para permitir fechar com clique
      >
        <DialogHeader className="flex flex-col items-center justify-center space-y-4 py-4">
            
          {/* Ícone Animado */}
          <div className="p-4 bg-white/20 rounded-full animate-pulse">
            <Scale className="h-12 w-12 text-white" />
          </div>

          <DialogTitle className="text-4xl font-bold tracking-tight text-center">
            {weight?.toFixed(3)} KG
          </DialogTitle>

          <DialogDescription className="text-blue-100 text-lg text-center flex flex-col items-center gap-2">
            <span>Peso detectado pela balança.</span>
            <span className="font-semibold flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg">
                <ScanBarcode className="w-5 h-5"/>
                Bipe o produto agora
            </span>
          </DialogDescription>
        </DialogHeader>
        
        {/* Rodapé discreto */}
        <div className="text-center text-xs text-blue-200 mt-2">
            Pressione ESC para cancelar o peso
        </div>
      </DialogContent>
    </Dialog>
  );
}
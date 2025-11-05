"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Zap } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const API_URL = "http://localhost:8000"; 

// ✅ Adicionando pdvSession às props
export function RecoveryModal({ open, onOpenChange, sale, onRecover, onDiscard, pdvSession }) {
    const [isLoading, setIsLoading] = React.useState(false);
    const totalVenda = sale?.valor_total || 0;
    const itemsCount = sale?.itens?.length || 0;
    
    // Handler para DELETAR a venda ativa
    const handleDiscard = async () => {
        if (!sale || isLoading) return;
        setIsLoading(true);
        
        try {
            // ✅ CORREÇÃO: Chamando a nova rota de DESCARTE (sem body)
            const response = await fetch(`${API_URL}/vendas/${sale.id}/descartar-venda-ativa`, {
                method: 'DELETE',
            });

            if (response.status === 204) { 
                toast.success("Venda descartada.", { description: `Venda #${sale.id} excluída do sistema.` });
                onDiscard(); 
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `Falha ao descartar venda (Status: ${response.status})`);
            }
        } catch (error) {
            console.error("Erro ao descartar:", error);
            toast.error("Erro", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center text-primary mb-3">
                        <Zap className="h-8 w-8" />
                    </div>
                    <DialogTitle className="text-center text-2xl">
                        Venda Ativa Encontrada!
                    </DialogTitle>
                    <DialogDescription className="text-center text-lg">
                        {/* ✅ Usando a prop pdvSession */}
                        O Caixa {pdvSession?.nome || ''} possui uma venda em andamento.
                    </DialogDescription>
                </DialogHeader>
                
                {/* Detalhes da Venda */}
                <div className="p-4 bg-muted rounded-lg text-center space-y-1">
                    <p className="text-base text-muted-foreground">Venda Nº: <span className="font-semibold text-foreground">{sale?.id || '---'}</span></p>
                    <p className="text-base text-muted-foreground">Itens: <span className="font-semibold text-foreground">{itemsCount}</span></p>
                    <p className="text-4xl font-bold text-primary pt-2">
                        {totalVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </p>
                </div>

                <DialogFooter className="flex-col sm:flex-row pt-2">
                    <Button 
                        variant="outline" 
                        onClick={handleDiscard} // Chama o handler de exclusão
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Descartar e Iniciar Nova'}
                    </Button>
                    <Button 
                        onClick={onRecover} // Chama o callback para recuperar (não é assíncrono)
                        disabled={isLoading}
                    >
                        Continuar Venda
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

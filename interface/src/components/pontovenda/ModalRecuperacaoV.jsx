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
import { Kbd } from "@/components/ui/kbd" // 1. Importa o Kbd

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

    React.useEffect(() => {
        // Só adiciona o listener se o modal estiver ABERTO
        if (open) {
            const handleKeyDown = (e) => {
                // Impede que o evento "vaze" para outros listeners (como o do PDV)
                e.stopPropagation(); 

                if (isLoading) return; // Não faz nada se já estiver carregando

                // Tecla "N" ou "n" para Descartar (Negar)
                if (e.key.toLowerCase() === 'n') {
                    e.preventDefault();
                    console.log("RecoveryModal: Hotkey 'N' -> Descartando Venda");
                    handleDiscard();
                }
                
                // Tecla "Enter" para Recuperar (Confirmar)
                if (e.key === 'Enter') {
                    e.preventDefault();
                    console.log("RecoveryModal: Hotkey 'Enter' -> Recuperando Venda");
                    // onRecover é uma função síncrona (só fecha o modal e define o estado)
                    onRecover(); 
                }
            };

            // Adiciona o listener
            document.addEventListener('keydown', handleKeyDown);

            // Função de limpeza: remove o listener quando o modal fecha
            return () => {
                document.removeEventListener('keydown', handleKeyDown);
            };
        }
    // Depende de 'open' para ligar/desligar, e das funções que chama
    }, [open, isLoading, onRecover, handleDiscard]);

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
                        onClick={handleDiscard}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Descartar'}
                        <Kbd className="ml-2">N</Kbd>
                    </Button>
                    
                    {/* ✅ 3. BOTÃO DE RECUPERAR COM KBD */}
                    <Button 
                        onClick={onRecover} 
                        disabled={isLoading}
                    >
                        Continuar Venda
                        <Kbd className="ml-2">Enter</Kbd>
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ArrowBigRight, DollarSign, Tag, Hash, Loader2 } from "lucide-react"
import { toast } from "sonner"

const API_URL = "http://localhost:8000";

// Componente recebe a função de submissão do pai
export function ManualItemModal({ open, onOpenChange, pdvSession, onManualItemAdded }) {
    
    const [descricao, setDescricao] = React.useState('');
    const [precoStr, setPrecoStr] = React.useState('');
    const [quantidadeStr, setQuantidadeStr] = React.useState('1');
    const [isLoading, setIsLoading] = React.useState(false);
    
    // Calcula o valor total e verifica se o input de preco é válido
    const preco = parseFloat(precoStr.replace(',', '.')) || 0;
    const quantidade = parseInt(quantidadeStr, 10) || 1;
    const total = preco * quantidade;

    // Reseta o estado local quando o modal abre ou fecha
    React.useEffect(() => {
        if (open) {
            setDescricao('');
            setPrecoStr('');
            setQuantidadeStr('1');
            setIsLoading(false);
            setTimeout(() => document.getElementById('item-description')?.focus(), 100);
        }
    }, [open]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (isLoading) return;

        if (!descricao.trim()) {
            toast.error("A descrição do produto diverso é obrigatória.");
            return;
        }
        if (preco <= 0) {
            toast.error("O preço unitário deve ser maior que zero.");
            return;
        }
        if (quantidade <= 0) {
            toast.error("A quantidade deve ser maior que zero.");
            return;
        }

        setIsLoading(true);

        const dataToSend = {
            descricao: descricao.trim(),
            preco_unitario: preco,
            quantidade: quantidade,
            pdv_id: pdvSession.id,
            operador_id: pdvSession.operador_atual.id, 
        };

        try {
            // ✅ Chama a nova rota de Lançamento Manual
            const response = await fetch(`${API_URL}/vendas/adicionar-item-manual`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (!response.ok) {
                const err = await response.json().catch(() => ({}));
                throw new Error(err.detail || "Falha ao lançar produto diverso.");
            }
            
            const updatedSale = await response.json();

            // Callback para a PontoVenda.jsx atualizar o estado
            onManualItemAdded(updatedSale); 
            onOpenChange(false);
            toast.success(`Item "${descricao}" adicionado à venda!`);

        } catch (error) {
            console.error("Erro ao adicionar item manual:", error);
            toast.error("Erro no Lançamento Manual", { description: error.message });
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-center text-primary mb-2">
                        <Tag className="h-8 w-8" />
                    </div>
                    <DialogTitle className="text-2xl text-center">Lançamento de Produto Diverso</DialogTitle>
                    <DialogDescription>
                        Defina a descrição e o preço do item não catalogado.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSave} className="space-y-4 py-4">
                    
                    {/* Campo Descrição */}
                    <div className="space-y-2">
                        <Label htmlFor="item-description">Descrição (Obrigatório)</Label>
                        <Input
                            id="item-description"
                            type="text"
                            value={descricao}
                            onChange={(e) => setDescricao(e.target.value)}
                            disabled={isLoading}
                            placeholder="Ex: Embalagem especial, Recarga de celular, etc."
                        />
                    </div>

                    {/* Campo Preço e Quantidade */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                             <Label htmlFor="item-price">Preço Unitário (R$)</Label>
                             <Input
                                id="item-price"
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={precoStr}
                                onChange={(e) => setPrecoStr(e.target.value)}
                                disabled={isLoading}
                                placeholder="0.00"
                             />
                        </div>
                        <div className="space-y-2">
                             <Label htmlFor="item-qty">Quantidade</Label>
                             <Input
                                id="item-qty"
                                type="number"
                                min="1"
                                step="1"
                                value={quantidadeStr}
                                onChange={(e) => setQuantidadeStr(e.target.value)}
                                disabled={isLoading}
                                placeholder="1"
                             />
                        </div>
                    </div>
                    
                    {/* Linha de Total */}
                    <div className="text-right pt-2 border-t mt-4">
                        <p className="text-base text-muted-foreground">Total a Lançar:</p>
                        <p className="text-3xl font-bold text-primary">
                            {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </p>
                    </div>

                    <DialogFooter className="pt-6">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                            Cancelar (ESC)
                        </Button>
                        <Button type="submit" disabled={isLoading || total <= 0}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Lançar Item
                        </Button>
                    </DialogFooter>
                </form>

            </DialogContent>
        </Dialog>
    );
}
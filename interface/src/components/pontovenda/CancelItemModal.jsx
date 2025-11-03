"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowUp, ArrowDown, X, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "lucide-react"

// O componente que lida com a remoção de itens
export function CancelItemModal({ open, onOpenChange, activeSale, onStartAuth }) {
    
    // Verificação de segurança (deve ser feito no componente pai, mas repetimos aqui)
    if (!activeSale || !activeSale.itens || activeSale.itens.length === 0) return null;

    const [selectedIndex, setSelectedIndex] = React.useState(0);
    const [quantityToRemove, setQuantityToRemove] = React.useState(1);
    
    // --- Efeito 1: Reset de Estado ao Abrir/Fechar ---
    React.useEffect(() => {
        if (open) {
            setSelectedIndex(0);
        }
        // Quando fecha, reseta tudo.
        if (!open && activeSale.itens.length > 0) {
            setSelectedIndex(0);
        }
    }, [open, activeSale]);
    
    // --- Efeito 2: Sincroniza Quantidade ao Mudar o Item Selecionado ---
    const selectedItem = activeSale.itens[selectedIndex];
    
    React.useEffect(() => {
        // Garante que, ao selecionar um novo item, a quantidade a remover volte para 1 (ou o total, se for 1)
        if (selectedItem) {
             setQuantityToRemove(Math.min(1, selectedItem.quantidade));
        }
    }, [selectedItem]);
    
    // O total disponível para remover é a quantidade total do item na venda
    const maxQuantity = selectedItem?.quantidade || 0;
    
    // --- Lógica de Navegação por Teclado e Ação de Remoção ---
    React.useEffect(() => {
        if (!open) return;

        const handleKeys = (e) => {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                // Se pressionar SHIFT, ajusta a QUANTIDADE
                if (e.shiftKey && quantityToRemove < maxQuantity) {
                    setQuantityToRemove(prev => Math.min(prev + 1, maxQuantity));
                } else {
                    // Senão, navega entre os ITENS
                    setSelectedIndex(prev => Math.max(0, prev - 1));
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                // Se pressionar SHIFT, ajusta a QUANTIDADE
                if (e.shiftKey && quantityToRemove > 1) {
                    setQuantityToRemove(prev => Math.max(1, prev - 1));
                } else {
                    // Senão, navega entre os ITENS
                    setSelectedIndex(prev => Math.min(activeSale.itens.length - 1, prev + 1));
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selectedItem) {
                   confirmRemoval();
                }
            }
        };
        document.addEventListener('keydown', handleKeys);
        return () => document.removeEventListener('keydown', handleKeys);
    }, [open, activeSale.itens.length, selectedItem, maxQuantity, quantityToRemove]); 
    // Dependências completas para garantir que as funções internas vejam os valores corretos.


    // --- Ação de Confirmação (Passa a Bola para o Admin Auth) ---
    const confirmRemoval = () => {
        if (!selectedItem || quantityToRemove <= 0 || quantityToRemove > maxQuantity) {
            alert("Ajuste a quantidade para remover.");
            return;
        }

        const itemData = {
            itemId: selectedItem.id, // ID do VendaItem a ser ajustado/removido
            saleId: activeSale.id,
            productName: selectedItem.produto.nome,
            totalQuantity: maxQuantity,
            quantityToRemove: quantityToRemove,
        };
        
        // Chama a função que abrirá o modal de Admin Auth
        onStartAuth(itemData);
    };
    
    const handleQuantityInputChange = (e) => {
        const value = parseFloat(e.target.value);
        if (isNaN(value) || value < 1) {
            setQuantityToRemove(1);
        } else if (value > maxQuantity) {
            setQuantityToRemove(maxQuantity);
        } else {
            setQuantityToRemove(value);
        }
    };

    // --- Renderização ---
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>Ajuste de Itens (F4)</DialogTitle>
                    <p className="text-sm text-muted-foreground">Selecione o item e a quantidade a ser cancelada/removida.</p>
                </DialogHeader>
                
                <div className="flex divide-x h-80">
                    {/* 1. Lista de Itens (Navegável) */}
                    <div className="w-1/2 overflow-y-auto pr-4 space-y-1">
                        <Label className="block mb-2 font-bold text-sm">Itens na Venda (↑↓ para navegar)</Label>
                        {activeSale.itens.map((item, index) => (
                            <div 
                                key={item.id} 
                                onClick={() => setSelectedIndex(index)} // Permite clique
                                className={cn(
                                    "p-2 rounded-lg transition-colors cursor-pointer flex justify-between items-center",
                                    index === selectedIndex ? 'bg-primary text-primary-foreground font-semibold shadow' : 'hover:bg-muted'
                                )}
                            >
                                <span>{item.produto.nome}</span>
                                <Badge variant={index === selectedIndex ? 'default' : 'secondary'}>Qtd: {item.quantidade}</Badge>
                            </div>
                        ))}
                    </div>

                    {/* 2. Detalhes e Ação */}
                    {selectedItem && (
                        <div className="w-1/2 pl-4 space-y-6 flex flex-col justify-between">
                            <div className="space-y-4">
                                <p className="font-bold text-xl">{selectedItem.produto.nome}</p>
                                <InfoItem 
                                    label="Preço Unitário na Venda" 
                                    value={selectedItem.preco_unitario_na_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                                />
                                <InfoItem 
                                    label="Total Atual na Venda" 
                                    value={maxQuantity} 
                                />

                                {/* Lógica do Input de Quantidade */}
                                <div className="space-y-2">
                                    <Label htmlFor="qty-to-remove" className="text-base font-semibold block">
                                        Quantidade a Cancelar (Shift + ↑↓)
                                    </Label>
                                    <div className="flex items-center space-x-2">
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setQuantityToRemove(prev => Math.max(1, prev - 1))}
                                            disabled={quantityToRemove <= 1}
                                        >
                                            <ArrowDown className="h-4 w-4" />
                                        </Button>
                                        <Input
                                            id="qty-to-remove"
                                            type="number"
                                            step="1"
                                            min="1"
                                            max={maxQuantity}
                                            className="text-2xl h-12 text-center"
                                            value={quantityToRemove}
                                            onChange={handleQuantityInputChange}
                                            onFocus={(e) => e.target.select()}
                                        />
                                        <Button 
                                            variant="outline" 
                                            onClick={() => setQuantityToRemove(prev => Math.min(prev + 1, maxQuantity))}
                                            disabled={quantityToRemove >= maxQuantity}
                                        >
                                            <ArrowUp className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground pt-1">Máximo: {maxQuantity}</p>
                                </div>
                            </div>
                            
                            <Button className="w-full text-lg h-12" onClick={confirmRemoval}>
                                <Check className="mr-2 h-5 w-5" />
                                Autorizar Remoção de {quantityToRemove} Unidade(s)
                            </Button>
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar (ESC)</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Pequeno componente auxiliar que você já usava no Header
const InfoItem = ({ label, value, className}) => (
    <div className="text-right">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={cn("font-semibold", className)}>{value}</p>
    </div>
);
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
  DialogClose,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, User } from "lucide-react"
import { cn } from "@/lib/utils"

const API_URL = "http://localhost:8000"; // Sua URL base

// Componente simples para a aba de Cartão/PIX
const PlaceholderPayment = ({ method, onConfirm }) => (
  <div className="py-10 text-center space-y-4">
    <p className="text-muted-foreground">Confirme o valor na máquina de {method}.</p>
    <Button 
      type="button" 
      size="lg" 
      className="text-lg p-6"
      onClick={() => onConfirm(method)} // Confirma o pagamento com este método
    >
      Confirmar Pagamento em {method}
    </Button>
  </div>
);

// Componente para a aba de Crediário (Fiado)
const CrediarioPayment = ({ onConfirm, onSelectClient, selectedClient }) => {
  // (Aqui você buscaria a lista de clientes, por enquanto é só um ID)
  
  return (
    <div className="py-10 text-center space-y-4">
      <Button 
        type="button" 
        variant="outline" 
        className="w-full" 
        onClick={onSelectClient} // Abre o modal de seleção de cliente
      >
        <User className="mr-2 h-4 w-4" />
        {selectedClient ? `Cliente: ${selectedClient.nome} (ID: ${selectedClient.id})` : "Selecionar Cliente (F3)"}
      </Button>
      <Button 
        type="button" 
        size="lg" 
        className="text-lg p-6"
        disabled={!selectedClient} // Só pode finalizar se o cliente for selecionado
        onClick={() => onConfirm('crediario')}
      >
        Lançar na Conta
      </Button>
    </div>
  );
};

// --- Componente Principal do Modal ---
export function PaymentModal({ open, onOpenChange, cartItems, pdvSession, onSaleSuccess, activeSale }) {
  const [paymentType, setPaymentType] = React.useState("dinheiro");
  const [valorRecebidoStr, setValorRecebidoStr] = React.useState("");
  const [selectedClient, setSelectedClient] = React.useState(null); // Para crediário
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");

  // Foco no input de valor recebido quando o modal abre
  const inputRef = React.useRef(null);
  React.useEffect(() => {
    if (open && paymentType === 'dinheiro') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open, paymentType]);

  // Cálculos de Total
  const subtotal = React.useMemo(() => 
    cartItems.reduce((acc, item) => acc + item.totalPrice, 0)
  , [cartItems]);
  
  // (Aqui entraria lógica de desconto)
  const total = subtotal; 
  
  const valorRecebido = parseFloat(valorRecebidoStr) || 0;
  const troco = Math.max(0, valorRecebido - total);

  // Dentro de modalVenda.jsx

// --- Função para processar o pagamento ---
const handleConfirmPayment = async (tipoPagamento) => {
    setIsLoading(true);
    setErrorMessage("");

    // 1. VERIFICAÇÃO DE DINHEIRO (não muda)
    if (tipoPagamento === 'dinheiro') {
        if (valorRecebido < total) {
            toast.error("Valor recebido é menor que o total da compra.");
            setIsLoading(false);
            return;
        }
    }
    
    // 2. MONTAGEM DO BODY (MUDOU)
    // A nova rota /{id}/finalizar espera um 'FinalizarVendaRequest',
    // que (pelo seu schema) só contém 'forma_pagamento'.
    const vendaRequest = {
        forma_pagamento: tipoPagamento 
        // Se você adicionou 'cliente_db_id' na rota de finalizar,
        // adicione aqui também.
        // cliente_db_id: tipoPagamento === 'crediario' ? selectedClient?.id : null,
    };

    try {
        // 3. CHAMADA DA API (MUDOU)
        // A URL agora é dinâmica e usa o ID da venda ativa
        const response = await fetch(`${API_URL}/vendas/${activeSale.id}/finalizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vendaRequest) // Envia o body simplificado
        });
        
        const result = await response.json();
        
        // 4. TRATAMENTO DE ERRO (Melhorado)
        if (!response.ok) {
             const errorMsg = result.detail[0]?.msg || result.detail || "Erro desconhecido";
             throw new Error(errorMsg);
        }
        
        // 5. SUCESSO (Callback)
        // O 'result' agora é o objeto 'Venda' finalizado.
        // O 'troco' é calculado localmente (como você já fazia).
        onSaleSuccess(result.id, troco); 
        
    } catch (error) {
        console.error(error);
        setErrorMessage(error.message);
        toast.error("Falha ao finalizar venda", { description: error.message });
    } finally {
        setIsLoading(false);
    }
};

  // Reseta o estado local quando o modal é fechado
  const handleOnOpenChange = (isOpen) => {
      if (!isOpen) {
          // Resetar estados
          setValorRecebidoStr("");
          setSelectedClient(null);
          setErrorMessage("");
          setPaymentType('dinheiro');
      }
      onOpenChange(isOpen); // Informa o pai
  }

  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogContent className="sm:max-w-md p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">Finalizar Venda</DialogTitle>
          <div className="flex justify-between items-baseline">
             <DialogDescription>Total a Pagar:</DialogDescription>
             <p className="text-4xl font-bold text-primary">
                 {total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
             </p>
          </div>
        </DialogHeader>

        {/* Corpo com Abas de Pagamento */}
        <div className="px-6">
            <Tabs value={paymentType} onValueChange={setPaymentType} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dinheiro">Dinheiro</TabsTrigger>
                    <TabsTrigger value="cartao">Cartão</TabsTrigger>
                    <TabsTrigger value="pix">PIX</TabsTrigger>
                    <TabsTrigger value="crediario">Crediário</TabsTrigger>
                </TabsList>
                
                {/* --- Aba Dinheiro --- */}
                <TabsContent value="dinheiro">
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="valor-recebido" className="text-lg">Valor Recebido (R$)</Label>
                            <Input 
                                ref={inputRef}
                                id="valor-recebido"
                                type="number"
                                step="0.01"
                                className="text-4xl h-16 p-4 text-right font-mono"
                                value={valorRecebidoStr}
                                onChange={(e) => setValorRecebidoStr(e.target.value)}
                                // Submete com Enter
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirmPayment('dinheiro')}
                                placeholder="0,00"
                            />
                        </div>
                         {/* Mostra o troco dinamicamente */}
                        {valorRecebido >= total && (
                            <div className="text-right space-y-1">
                                <Label className="text-lg">Troco</Label>
                                <p className="text-3xl font-bold text-yellow-500">
                                    {troco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                            </div>
                        )}
                    </div>
                </TabsContent>
                
                {/* --- Outras Abas --- */}
                <TabsContent value="cartao">
                   <PlaceholderPayment method="Cartão" onConfirm={() => handleConfirmPayment('cartao')} />
                </TabsContent>
                <TabsContent value="pix">
                   <PlaceholderPayment method="PIX" onConfirm={() => handleConfirmPayment('pix')} />
                </TabsContent>
                <TabsContent value="crediario">
                   <CrediarioPayment 
                       onConfirm={() => handleConfirmPayment('crediario')}
                       onSelectClient={() => alert("(WIP) Abrir modal de seleção de cliente (F3)")}
                       selectedClient={selectedClient}
                   />
                </TabsContent>
            </Tabs>
        </div>

        {errorMessage && (
            <div className="px-6 pb-2">
                 <p className="text-sm text-destructive text-center">{errorMessage}</p>
            </div>
        )}
        
        <DialogFooter className="p-6 pt-2 bg-muted/50 rounded-b-lg">
          <DialogClose asChild>
            <Button variant="outline" size="lg" disabled={isLoading}>Cancelar Venda (ESC)</Button>
          </DialogClose>
          {/* Mostra o botão de Finalizar apenas na aba Dinheiro (outras têm o seu) */}
          {paymentType === 'dinheiro' && (
             <Button 
                type="button" 
                size="lg" 
                onClick={() => handleConfirmPayment('dinheiro')} 
                disabled={isLoading || valorRecebido < total}
             >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Finalizar (F1)
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

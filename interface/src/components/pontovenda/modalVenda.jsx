"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { Loader2, User, CreditCard, Smartphone, Banknote, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CurrencyInput } from "../ui/input-monetario" // Usando seu input "modo bruto"
import { Kbd } from "@/components/ui/kbd" // Importando Kbd

const API_URL = "http://localhost:8000"; 

export function PaymentModal({ open, onOpenChange, cartItems, pdvSession, onSaleSuccess, activeSale }) {
  const [paymentType, setPaymentType] = React.useState("dinheiro");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  
  const [currentInputValue, setCurrentInputValue] = React.useState(0); 
  const [paymentsList, setPaymentsList] = React.useState([]); 
  const [selectedClient, setSelectedClient] = React.useState(null); 

  const inputRef = React.useRef(null);

  const totalVenda = React.useMemo(() => 
    cartItems.reduce((acc, item) => acc + item.totalPrice, 0)
  , [cartItems]);
  
  const totalPago = React.useMemo(() =>
    paymentsList.reduce((acc, p) => acc + p.valor, 0)
  , [paymentsList]);
  
  const valorRestante = totalVenda - totalPago;

  React.useEffect(() => {
    if (open) {
      const restanteFormatado = parseFloat(valorRestante.toFixed(2));
      setCurrentInputValue(restanteFormatado > 0 ? restanteFormatado : 0);
      
      setTimeout(() => {
        inputRef.current?.focus();
      }, 30);
      setTimeout(() => {
        inputRef.current?.select();
      }, 100);
    }
  }, [open, paymentType, totalPago]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (!open || isLoading) return; 

      // Atalhos das Abas
      if (e.key === 'F5') { e.preventDefault(); setPaymentType('dinheiro'); }
      if (e.key === 'F6') { e.preventDefault(); setPaymentType('cartao'); }
      if (e.key === 'F7') { e.preventDefault(); setPaymentType('pix'); }
      if (e.key === 'F8') { e.preventDefault(); setPaymentType('crediario'); }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleOnOpenChange(false); // Chama o fechamento
      }
      
      if (e.key === 'Enter' || e.key === 'F1') {
         e.preventDefault();
         handlePrimaryAction();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, isLoading, paymentType, currentInputValue, valorRestante, paymentsList]); // Dependências completas

  const handleAddPayment = () => {
    const valor = parseFloat(currentInputValue);
    
    if (valor <= 0) {
        toast.warning("Valor inválido", { description: "Insira um valor maior que zero para adicionar." });
        return;
    }
    if (valor > valorRestante) {
        toast.warning("Valor muito alto", { description: `O valor máximo a adicionar é ${valorRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`});
        setCurrentInputValue(valorRestante);
        return;
    }
    if (paymentType === 'crediario' && !selectedClient) {
        toast.error("Cliente não selecionado", { description: "Selecione um cliente (F3) para lançar em crediário." });
        return;
    }

    const newPayment = {
        tipo: paymentType,
        valor: valor,
        cliente_id: paymentType === 'crediario' ? selectedClient.id : null,
        cliente_nome: paymentType === 'crediario' ? selectedClient.nome : null,
    };
    
    setPaymentsList(prev => [...prev, newPayment]);
  };

const handleConfirmSale = async () => {
  const valorInput = parseFloat(currentInputValue);

  let finalPaymentsList = [...paymentsList];

  if (valorInput > 0) {
    finalPaymentsList = [
      ...paymentsList,
      {
        tipo: paymentType,
        valor: valorInput,
        cliente_id: paymentType === "crediario" ? selectedClient?.id : null,
        cliente_nome: paymentType === "crediario" ? selectedClient?.nome : null,
      },
    ];
  }

  const finalTotalPago = totalPago + valorInput;
  const troco = Math.max(0, finalTotalPago - totalVenda);

  if (finalTotalPago < totalVenda) {
    toast.error("Pagamento Incompleto", {
      description: `Ainda falta ${(totalVenda - finalTotalPago).toLocaleString(
        "pt-BR",
        { style: "currency", currency: "BRL" }
      )}`,
    });
    return;
  }

  setIsLoading(true);
  setErrorMessage("");

  const vendaRequest = {
      pdv_db_id: pdvSession.id,
      operador_db_id: pdvSession.operador_atual.id,
      cliente_db_id: selectedClient?.id || null,
      itens: cartItems.map((item) => ({
        db_id: item.db_id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      pagamentos: finalPaymentsList.map((p) => ({
        tipo: p.tipo,
        valor: p.valor,
      })),
      total_calculado: totalVenda,
  };

  try {
      const response = await fetch(`${API_URL}/vendas/finalizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendaRequest),
      });

      const result = await response.json();
      
      if (!response.ok) {
          const errorMsg = result.detail[0]?.msg || result.detail || "Erro desconhecido";
          throw new Error(errorMsg);
      }
      onSaleSuccess(result.venda_id, result.troco);

      } catch (error) {
          console.error(error);
          setErrorMessage(error.message);
          toast.error("Falha ao finalizar venda", { description: error.message });
      } finally {
          setIsLoading(false);
      }
    };

  
  const handlePrimaryAction = () => {
      const valorInput = parseFloat(currentInputValue);
      
      if (valorInput < valorRestante) {
          console.log("Ação: Adicionar Pagamento");
          handleAddPayment();
      } 
      else {
          console.log("Ação: Finalizar Venda");
          handleConfirmSale();
      }
  };

  const handleOnOpenChange = (isOpen) => {
    if (!isOpen) {
      setCurrentInputValue(0);
      setSelectedClient(null);
      setErrorMessage("");
      setPaymentType("dinheiro");
      setPaymentsList([]);
    }

    if (isLoading && isOpen) return;

    onOpenChange(isOpen);
  };


  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogContent className="sm:max-w-lg p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl">Finalizar Venda</DialogTitle>
          <div className="flex justify-between items-baseline pt-2">
             <DialogDescription className="text-lg">Total da Venda:</DialogDescription>
             <p className="text-2xl font-bold text-muted-foreground">
                 {totalVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
             </p>
          </div>
          <div className={cn(
             "flex justify-between items-baseline",
             valorRestante <= 0 && "text-green-600" 
          )}>
             <DialogDescription className="text-lg font-semibold">
                {valorRestante <= 0 ? "Troco:" : "Restante:"}
             </DialogDescription>
             <p className="text-4xl font-bold">
                 {Math.abs(valorRestante).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
             </p>
          </div>
        </DialogHeader>

        {paymentsList.length > 0 && (
            <div className="px-6 space-y-2">
                <Label>Pagamentos Registrados:</Label>
                <div className="space-y-1 max-h-24 overflow-y-auto p-2 bg-muted rounded-md">
                    {paymentsList.map((p, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                {p.tipo === 'dinheiro' && <Banknote className="h-4 w-4" />}
                                {p.tipo === 'cartao' && <CreditCard className="h-4 w-4" />}
                                {p.tipo === 'pix' && <Smartphone className="h-4 w-4" />}
                                {p.tipo === 'crediario' && <User className="h-4 w-4" />}
                                <span className="capitalize">{p.tipo}</span>
                                {p.cliente_nome && <span className="text-xs text-muted-foreground">({p.cliente_nome})</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium">{p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemovePayment(index)}>
                                    <X className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="px-6">
            <Tabs value={paymentType} onValueChange={setPaymentType} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="dinheiro">Dinheiro<Kbd className="ml-2">F5</Kbd></TabsTrigger>
                    <TabsTrigger value="cartao">Cartão<Kbd className="ml-2">F6</Kbd></TabsTrigger>
                    <TabsTrigger value="pix">PIX<Kbd className="ml-2">F7</Kbd></TabsTrigger>
                    <TabsTrigger value="crediario">Crediário<Kbd className="ml-2">F8</Kbd></TabsTrigger>
                </TabsList>
                
                <div className="space-y-2 py-4">
                    <Label htmlFor="valor-pagamento" className="text-lg">
                        {paymentType === 'crediario' ? 'Valor a Lançar' : `Valor (${paymentType})`}
                    </Label>
                    <CurrencyInput 
                        ref={inputRef}
                        id="valor-pagamento"
                        className="text-4xl h-16 p-4 text-right font-mono"
                        value={currentInputValue}
                        onChange={setCurrentInputValue} 
                        placeholder="R$ 0,00"
                        disabled={isLoading || valorRestante <= 0}
                    />
                </div>
                
                <TabsContent value="dinheiro" />
                <TabsContent value="cartao" />
                <TabsContent value="pix" />
                <TabsContent value="crediario">
                   <div className="space-y-4">
                       <Button 
                         type="button" 
                         variant="outline" 
                         className="w-full" 
                         onClick={() => alert("(WIP) Abrir modal de seleção de cliente (F3)")}
                       >
                         <User className="mr-2 h-4 w-4" />
                         {selectedClient ? `Cliente: ${selectedClient.nome}` : "Selecionar Cliente (F3)"}
                       </Button>
                   </div>
                </TabsContent>
            </Tabs>
        </div>

        {errorMessage && (
             <div className="px-6 pb-2">
                 <p className="text-sm text-destructive text-center">{errorMessage}</p>
             </div>
         )}
        
        <DialogFooter className="p-6 pt-2 bg-muted/50 rounded-b-lg">
          <Button variant="outline" size="lg" disabled={isLoading} onClick={() => handleOnOpenChange(false)}>
            Cancelar <Kbd className="ml-2">ESC</Kbd>
          </Button>
          <Button 
             type="button" 
             size="lg" 
             onClick={handlePrimaryAction} 
             disabled={isLoading || (currentInputValue <= 0 && valorRestante > 0) || (paymentType === 'crediario' && !selectedClient)} 
          >
             {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             {valorRestante > 0 && currentInputValue < valorRestante ? 'Adicionar Pagamento' : 'Finalizar Venda'}
             <Kbd className="ml-2">F1</Kbd>
         </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
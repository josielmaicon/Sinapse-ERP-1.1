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
import { Loader2, User, CreditCard, Smartphone, Banknote, X, Search, ShieldAlert } from "lucide-react"
import { cn } from "@/lib/utils"
import { CurrencyInput } from "../ui/input-monetario"
import { Kbd } from "@/components/ui/kbd"
import { ClientSelectionModal } from "@/components/pontovenda/ModalSelecaoCliente"
import { LimitOverrideModal } from "./QuebraLimiteModal"

const API_URL = "http://localhost:8000"; 

export function PaymentModal({ open, onOpenChange, cartItems, pdvSession, onSaleSuccess, activeSale }) {
  const [paymentType, setPaymentType] = React.useState("dinheiro");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isClientModalOpen, setIsClientModalOpen] = React.useState(false);
  const [currentInputValue, setCurrentInputValue] = React.useState(0); 
  const [paymentsList, setPaymentsList] = React.useState([]); 
  const [selectedClient, setSelectedClient] = React.useState(null); 
  const [isOverrideModalOpen, setIsOverrideModalOpen] = React.useState(false);
  const [overrideMessage, setOverrideMessage] = React.useState("");

  const inputRef = React.useRef(null);
  const [isAwaitingOverride, setIsAwaitingOverride] = React.useState(false);
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
    if (open && !isClientModalOpen) { 
      const restanteFormatado = parseFloat(valorRestante.toFixed(2));
      setCurrentInputValue(restanteFormatado > 0 ? restanteFormatado : 0);
      
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 100);
    }
  }, [open, isClientModalOpen, paymentType, totalPago]);

  const handleOverrideConfirm = async (password) => {
      await handleConfirmSale(password);
  };

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

// ...
  const handleConfirmSale = React.useCallback(async (adminPassword = null) => {
    const valorInput = parseFloat(currentInputValue);
    let finalPaymentsList = [...paymentsList];
    
    // Adiciona o pagamento atual se ele completar o valor (com margem de erro float)
    if (valorInput > 0 && Math.abs(valorInput - valorRestante) < 0.01) {
        finalPaymentsList.push({
            tipo: paymentType,
            valor: valorInput,
            // Garante que cliente_id seja null se não for crediário
            cliente_id: paymentType === 'crediario' ? selectedClient?.id : null,
            cliente_nome: paymentType === 'crediario' ? selectedClient?.nome : null,
        });
    }
    
    const finalTotalPago = finalPaymentsList.reduce((acc, p) => acc + p.valor, 0);
    const troco = Math.max(0, finalTotalPago - totalVenda);

    if (finalTotalPago < totalVenda - 0.01) {
       toast.error("Pagamento Incompleto"); return;
    }

    setIsLoading(true);
    setErrorMessage("");

    // ✅ 1. MONTAGEM ROBUSTA DO REQUEST
    const vendaRequest = {
        pdv_db_id: pdvSession.id,
        operador_db_id: pdvSession.operador_atual.id,
        // Busca o cliente da primeira transação de crediário encontrada (se houver)
        cliente_db_id: finalPaymentsList.find(p => p.tipo === 'crediario')?.cliente_id || null,
        itens: cartItems.map(item => ({
            db_id: item.db_id,
            quantity: item.quantity,
            unitPrice: item.unitPrice
        })),
        // Limpa os dados extras antes de enviar para a API (para bater com o schema PdvPagamento)
        pagamentos: finalPaymentsList.map(p => ({ 
            tipo: p.tipo, 
            valor: p.valor 
        })),
        total_calculado: totalVenda,
        // Garante que override_auth seja enviado (mesmo que null)
        override_auth: adminPassword ? { admin_senha: adminPassword } : null
    };
    
    console.log("Enviando vendaRequest:", JSON.stringify(vendaRequest, null, 2)); // LOG CRUCIAL

    try {
        const response = await fetch(`${API_URL}/vendas/finalizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vendaRequest)
        });
        
        const result = await response.json();
        console.log("Status da resposta da venda:", response.status);
        
          if (!response.ok) {
            if (response.status === 402 || response.status === 403) { 
                const tipoBloqueio = response.status === 402 ? "Limite Excedido" : "Conta Bloqueada";
                toast.warning(tipoBloqueio, { 
                    description: `${result.detail}`,
                    duration: 8000 // Um pouco mais de tempo para ler
                });
                setOverrideMessage(result.detail);
                setIsAwaitingOverride(true); // Arma o F8
                return; 
            }

            throw new Error(result.detail || "Erro ao finalizar venda.");
        }
        
        setIsOverrideModalOpen(false);
        onSaleSuccess(result.venda_id, troco); 
        
    } catch (error) {
        console.error("Erro no handleConfirmSale:", error);
        setErrorMessage(error.message);
        // Mostra o erro detalhado no toast
        toast.error("Falha ao finalizar venda", { description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [currentInputValue, paymentsList, totalVenda, pdvSession, cartItems, activeSale, selectedClient, onSaleSuccess, valorRestante, paymentType, totalPago]);

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

  const CrediarioStatus = ({ selectedClient, onRemoveClient }) => {
  if (!selectedClient) {
      return (
          <div className="py-10 text-center text-muted-foreground flex flex-col items-center gap-2 opacity-50">
              <User className="h-16 w-16" />
              <p className="text-lg">Nenhum cliente selecionado</p>
          </div>
      );
  }

  return (
    <div className="py-6 flex flex-col items-center gap-4">
        <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
            <User className="h-8 w-8 text-primary" />
            <div className="text-left">
                <p className="font-bold text-lg">{selectedClient.nome}</p>
                <p className="text-sm text-muted-foreground">CPF: {selectedClient.cpf || '---'}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onRemoveClient}>
                <X className="h-5 w-5" />
            </Button>
        </div>
        <p className="text-sm text-muted-foreground">
            Limite Disponível: R$ {selectedClient.limite_disponivel === Infinity ? 'Ilimitado' : (selectedClient.limite_disponivel || 0).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
        </p>
      </div>
    );
  };

const mainButtonConfig = React.useMemo(() => {
      // ESTADO 1: Crediário sem cliente -> "Selecionar Cliente"
      if (paymentType === 'crediario' && !selectedClient) {
          return {
              text: "Selecionar Cliente",
              icon: <Search className="mr-2 h-5 w-5" />,
              hotkey: "F3", // Atalho específico
              action: () => setIsClientModalOpen(true), // Abre modal de seleção
              disabled: isLoading
          };
      }

      const valorInput = parseFloat(currentInputValue) || 0;
      
      // ESTADO 2: Valor menor que o restante -> "Adicionar Pagamento"
      // (Usamos 0.01 como margem de segurança para comparações de float)
      if (valorRestante > 0.01 && valorInput < (valorRestante - 0.01)) {
          return {
              text: "Adicionar Pagamento",
              icon: null, // Ou um ícone de Plus
              hotkey: "Enter", // Enter é mais natural para adicionar
              action: handleAddPayment,
              disabled: isLoading || valorInput <= 0
          };
      }

      // ESTADO 3: Valor quita a dívida -> "Finalizar Venda"
      return {
          text: "Finalizar Venda",
          icon: null, // Ou um ícone de Check
          hotkey: "F1",
          action: handleConfirmSale,
          // Desabilitado se o valor for 0 e ainda tiver dívida, OU se estiver carregando
          disabled: isLoading || (valorInput <= 0 && valorRestante > 0.01)
      };
  }, [paymentType, selectedClient, currentInputValue, valorRestante, isLoading]);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Guarda principal (silenciador)
      if (!open || isLoading || isClientModalOpen || isOverrideModalOpen) return; 

      // Atalhos das Abas (F5-F7)
      if (e.key === 'F5') { e.preventDefault(); setPaymentType('dinheiro'); }
      if (e.key === 'F6') { e.preventDefault(); setPaymentType('cartao'); }
      if (e.key === 'F7') { e.preventDefault(); setPaymentType('pix'); }
      
      if (e.key === 'F8') { 
          e.preventDefault();
          console.log("F8 pressionado. Awaiting Override?", isAwaitingOverride); // Debug
          if (isAwaitingOverride) {
              setIsOverrideModalOpen(true);
          } else {
              setPaymentType('crediario'); 
          }
      }

      if (e.key === 'Escape') { e.preventDefault(); handleOnOpenChange(false); }
      
      // Atalho de Ação Principal (Enter ou F1)
      if (e.key.toLowerCase() === mainButtonConfig.hotkey.toLowerCase() || 
         (e.key === 'Enter' && mainButtonConfig.hotkey === 'F1') ||
         (e.key === 'Enter' && mainButtonConfig.hotkey === 'Enter')
      ) {
         e.preventDefault();
         if (!mainButtonConfig.disabled) {
             mainButtonConfig.action();
         }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  
  }, [open, isLoading, mainButtonConfig, isAwaitingOverride, paymentType, isClientModalOpen, isOverrideModalOpen, handleOnOpenChange, isAwaitingOverride]); // Adiciona isAwaitingOverride

  React.useEffect(() => {
  if (open) {
    setIsAwaitingOverride(false);
    setSelectedClient(null);
    setPaymentsList([]);
    setPaymentType("dinheiro");
    setErrorMessage("");
    setIsLoading(false);
  }
}, [open]);

  return (
    <>
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
                    <TabsTrigger value="crediario"> Crediário <Kbd className={cn("ml-2 transition-all duration-300")}>
                            <span>F8</span>
                        </Kbd>
                    </TabsTrigger>
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
                        onKeyDown={(e) => {
                           if (e.key === 'Enter') {
                               e.preventDefault();
                               e.stopPropagation();
                               handlePrimaryAction();
                           }
                       }}
                        placeholder="R$ 0,00"
                        disabled={isLoading || (valorRestante <= 0 && paymentType === 'dinheiro')}
                    />
                </div>
                
                <TabsContent value="dinheiro" />
                <TabsContent value="cartao" />
                <TabsContent value="pix" />
                <TabsContent value="crediario">
                   <CrediarioStatus 
                       selectedClient={selectedClient} 
                       onRemoveClient={() => setSelectedClient(null)}
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
          <Button variant="outline" size="lg" disabled={isLoading} onClick={() => handleOnOpenChange(false)}>
            Cancelar <Kbd className="ml-2">ESC</Kbd>
          </Button>
          <Button 
             type="button" 
             size="lg" 
             onClick={mainButtonConfig.action} 
             disabled={mainButtonConfig.disabled} 
             className="min-w-[200px]" // Garante um tamanho mínimo para não pular muito
          >
             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : mainButtonConfig.icon}
             {mainButtonConfig.text}
             <Kbd className="ml-2">{mainButtonConfig.hotkey}</Kbd>
         </Button>
        </DialogFooter>
      </DialogContent>

    </Dialog>
      <ClientSelectionModal 
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        onClientSelect={(client) => {
            setSelectedClient(client);
            // Opcional: Focar no input de valor após selecionar
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
      />
    <LimitOverrideModal
        open={isOverrideModalOpen}
        onOpenChange={setIsOverrideModalOpen}
        message={overrideMessage}
        onConfirmOverride={handleOverrideConfirm}
    />
    </>
  )
}
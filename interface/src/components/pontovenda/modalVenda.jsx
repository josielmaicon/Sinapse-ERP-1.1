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
import { 
  Loader2, 
  User, 
  CreditCard, 
  Smartphone, 
  UserPlus,
  Banknote, 
  X, 
  Search, 
  WalletCards, 
  QrCode 
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CurrencyInput } from "../ui/input-monetario"
import { Kbd } from "@/components/ui/kbd"
import { ClientSelectionModal } from "@/components/pontovenda/ModalSelecaoCliente"
import { LimitOverrideModal } from "./QuebraLimiteModal"
import { Input } from "@/components/ui/input"

const API_URL = "http://localhost:8000"; 

// Função auxiliar para mapear strings do banco de dados para ícones do Lucide
const getMethodIcon = (tipo) => {
  switch (tipo) {
    case 'dinheiro': return <Banknote className="h-4 w-4" />;
    case 'cartao': return <CreditCard className="h-4 w-4" />;
    case 'pix': return <Smartphone className="h-4 w-4" />;
    case 'crediario': return <User className="h-4 w-4" />;
    default: return <WalletCards className="h-4 w-4" />;
  }
};

const CpfPrompt = ({ onConfirm, onSkip }) => {
    const [cpf, setCpf] = React.useState("");
    const inputRef = React.useRef(null);

    // Foco automático ao abrir
    React.useEffect(() => {
        setTimeout(() => inputRef.current?.focus(), 50);
    }, []);

    const handleChange = (e) => {
        // Aceita apenas números e limita a 14 (CPF formatado ou não)
        const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 11);
        setCpf(value);
    };

    const handleKeyDown = (e) => {
            // ✅ AQUI ESTÁ A CHAVE: Impede que o Enter suba para o modal global
            e.stopPropagation(); 

            if (e.key === 'Enter') {
                e.preventDefault();
                if (cpf.length === 11) onConfirm(cpf);
                else if (cpf.length === 0) onSkip(); 
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                onSkip();
            }
        };

    return (
        <div className="flex flex-col items-center justify-center py-10 gap-6 animate-in zoom-in-95 duration-200">
            <div className="bg-primary/10 p-4 rounded-full">
                <UserPlus className="h-10 w-10 text-primary" />
            </div>
            
            <div className="text-center space-y-1">
                <h3 className="text-2xl font-bold tracking-tight">CPF na Nota?</h3>
                <p className="text-muted-foreground text-sm">Digite o CPF do cliente ou prossiga sem identificar.</p>
            </div>

            <div className="w-full max-w-xs space-y-4">
                <Input 
                    ref={inputRef}
                    value={cpf}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="000.000.000-00"
                    className="text-center text-2xl h-14 tracking-widest font-mono"
                    maxLength={11}
                />
                
                <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline" size="lg" onClick={onSkip} className="text-muted-foreground hover:text-foreground">
                        Sem CPF <Kbd className="ml-2 text-xs">Esc</Kbd>
                    </Button>
                    <Button 
                        size="lg" 
                        onClick={() => onConfirm(cpf)} 
                        disabled={cpf.length !== 11}
                        className={cn(cpf.length === 11 ? "animate-pulse" : "")}
                    >
                        Confirmar <Kbd className="ml-2 text-xs">Enter</Kbd>
                    </Button>
                </div>
            </div>
        </div>
    );
};


export function PaymentModal({ open, onOpenChange, cartItems, pdvSession, onSaleSuccess, activeSale }) {
  // --- ESTADOS DE DADOS ---
  const [availableMethods, setAvailableMethods] = React.useState([]); // Lista de métodos vindos da API
  const [selectedMethodId, setSelectedMethodId] = React.useState(null); // ID do método selecionado (aba atual)
  const [step, setStep] = React.useState('cpf');

  // --- ESTADOS DE CONTROLE ---
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isClientModalOpen, setIsClientModalOpen] = React.useState(false);
  
  // --- ESTADOS DO INPUT E PAGAMENTOS ---
  const [cpfNota, setCpfNota] = React.useState("");
  const [currentInputValue, setCurrentInputValue] = React.useState(0); 
  const [paymentsList, setPaymentsList] = React.useState([]); 
  const [selectedClient, setSelectedClient] = React.useState(null); 
  
  // --- ESTADOS DE OVERRIDE (QUEBRA DE LIMITE) ---
  const [isOverrideModalOpen, setIsOverrideModalOpen] = React.useState(false);
  const [overrideMessage, setOverrideMessage] = React.useState("");
  const [isAwaitingOverride, setIsAwaitingOverride] = React.useState(false);

  const inputRef = React.useRef(null);
  const currentMethod = React.useMemo(() => 
      availableMethods.find(m => String(m.id) === selectedMethodId) || {}
  , [availableMethods, selectedMethodId]);

  // --- MEMOS E CÁLCULOS ---

  // Encontra o objeto completo do método selecionado com base no ID
  const selectedMethod = React.useMemo(() => {
    return availableMethods.find(m => String(m.id) === String(selectedMethodId)) || null;
  }, [availableMethods, selectedMethodId]);

  const totalVenda = React.useMemo(() => 
    cartItems.reduce((acc, item) => acc + item.totalPrice, 0)
  , [cartItems]);
  
  const totalPago = React.useMemo(() =>
    paymentsList.reduce((acc, p) => acc + p.valor, 0)
  , [paymentsList]);
  
  const valorRestante = totalVenda - totalPago;

  // --- EFEITOS (USE EFFECTS) ---

  // 1. Buscar métodos ao abrir o modal
  React.useEffect(() => {
    if (open) {
      const fetchMethods = async () => {
        try {
          const res = await fetch(`${API_URL}/configuracoes/financeiro/metodos`);
          if (!res.ok) throw new Error("Falha ao carregar formas de pagamento");
          
          const data = await res.json();
          // Filtra apenas os métodos ativos
          const activeMethods = data.filter(m => m.ativo);
          
          setAvailableMethods(activeMethods);

          // Seleciona automaticamente o primeiro método da lista, se houver
          if (activeMethods.length > 0) {
            setSelectedMethodId(String(activeMethods[0].id));
          }

        } catch (error) {
          console.error(error);
          toast.error("Erro de Configuração", { 
            description: "Não foi possível carregar as formas de pagamento do servidor." 
          });
        }
      };

      fetchMethods();

      // Resetar estados ao abrir
      setIsAwaitingOverride(false);
      setSelectedClient(null);
      setPaymentsList([]);
      setErrorMessage("");
      setIsLoading(false);
    }
  }, [open]);

  // 2. Focar no input quando o modal abre ou troca de aba
  React.useEffect(() => {
    if (open && !isClientModalOpen && !isOverrideModalOpen) { 
      const restanteFormatado = parseFloat(valorRestante.toFixed(2));
      setCurrentInputValue(restanteFormatado > 0 ? restanteFormatado : 0);
      
      // Pequeno delay para garantir que o DOM renderizou
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      
      setTimeout(() => {
        inputRef.current?.select();
      }, 100);
    }
  }, [open, isClientModalOpen, isOverrideModalOpen, selectedMethodId, totalPago, valorRestante]);

const resetModalState = React.useCallback(() => {
      setStep('cpf'); // Força etapa 1
      setCpfNota(null);
      setErrorMessage("");
      setPaymentsList([]);
      setIsAwaitingOverride(false);
      setSelectedClient(null);
      
      const restante = parseFloat(totalVenda.toFixed(2)); // Usa totalVenda aqui pois paymentsList foi zerada
      setCurrentInputValue(restante > 0 ? restante : 0);
  }, [totalVenda]);

  // ✅ 2. EFEITO DE ABERTURA (Garante o Reset sempre que 'open' virar true)
  React.useEffect(() => {
    if (open) {
        // Limpa tudo ao abrir
        resetModalState();

        // Busca métodos atualizados
        fetch(`${API_URL}/configuracoes/financeiro/metodos`)
        .then(res => res.json())
        .then(data => {
            const ativos = data.filter(m => m.ativo);
            setAvailableMethods(ativos);
            // Seleciona dinheiro por padrão
            const defaultMethod = ativos.find(m => m.tipo === 'dinheiro' || m.tipo === 'especie') || ativos[0];
            if (defaultMethod) setSelectedMethodId(String(defaultMethod.id));
        })
        .catch(err => console.error("Erro ao carregar métodos:", err));
    }
  }, [open, resetModalState]);

  const handleRemovePayment = (index) => {
    setPaymentsList(prev => prev.filter((_, i) => i !== index));
  };

  const handleOverrideConfirm = async (password) => {
      await handleConfirmSale(password);
  };

  const handleAddPayment = () => {
    const valor = parseFloat(currentInputValue);
    
    // Validações básicas
    if (!selectedMethod) return;
    
    if (valor <= 0) {
        toast.warning("Valor inválido", { description: "Insira um valor maior que zero." });
        return;
    }
    
    if (valor > valorRestante + 0.01) { // Margem de erro float
        toast.warning("Valor muito alto", { description: `O valor máximo é ${valorRestante.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`});
        setCurrentInputValue(valorRestante);
        return;
    }

    // Validação específica para Crediário
    if (selectedMethod.tipo === 'crediario' && !selectedClient) {
        toast.error("Cliente não selecionado", { description: "É necessário identificar o cliente para esta forma de pagamento." });
        setIsClientModalOpen(true);
        return;
    }

    const newPayment = {
        // Dados para o Backend
        metodo_id: selectedMethod.id,
        tipo: selectedMethod.tipo,
        
        // Dados para Exibição
        nome_exibicao: selectedMethod.nome,
        valor: valor,
        
        // Dados Condicionais
        cliente_id: selectedMethod.tipo === 'crediario' ? selectedClient.id : null,
        cliente_nome: selectedMethod.tipo === 'crediario' ? selectedClient.nome : null,
    };
    
    setPaymentsList(prev => [...prev, newPayment]);
  };

    const handleCpfConfirm = (cpf) => {
      setCpfNota(cpf);
      setStep('payment'); // Avança para pagamento
  };

    const handleCpfSkip = () => {
      setCpfNota(null);
      setStep('payment'); // Avança sem CPF
  };

const handleOnOpenChange = (isOpen) => {
      if (isLoading) return; 
      if (!isOpen) {
          resetModalState(); // Limpa ao fechar manualmente também
      }
      onOpenChange(isOpen);
  };

  const handleConfirmSale = React.useCallback(async (adminPassword = null) => {
    const valorInput = parseFloat(currentInputValue);
    let finalPaymentsList = [...paymentsList];
    
    // Tenta pegar o método atual via referência segura
    const currentMethod = availableMethods.find(m => String(m.id) === String(selectedMethodId));

    // Lógica de "Completar Venda": Se o usuário der Enter com o valor restante no input, já adiciona e finaliza
    if (currentMethod && valorInput > 0 && Math.abs(valorInput - valorRestante) < 0.01) {
        
        // Verificação de segurança para crediário na finalização automática
        if (currentMethod.tipo === 'crediario' && !selectedClient) {
           toast.error("Cliente Obrigatório", { description: "Selecione o cliente antes de finalizar." });
           return;
        }

        finalPaymentsList.push({
            metodo_id: currentMethod.id,
            tipo: currentMethod.tipo,
            nome_exibicao: currentMethod.nome,
            valor: valorInput,
            cliente_id: currentMethod.tipo === 'crediario' ? selectedClient?.id : null,
            cliente_nome: currentMethod.tipo === 'crediario' ? selectedClient?.nome : null,
        });
    }
    
    const finalTotalPago = finalPaymentsList.reduce((acc, p) => acc + p.valor, 0);
    const troco = Math.max(0, finalTotalPago - totalVenda);

    if (finalTotalPago < totalVenda - 0.01) {
       toast.error("Pagamento Incompleto", { description: "O valor total pago é menor que o valor da venda." });
       return;
    }

    setIsLoading(true);
    setErrorMessage("");

    // --- MONTAGEM DO REQUEST (PAYLOAD) ---
    const vendaRequest = {
        pdv_db_id: pdvSession.id,
        operador_db_id: pdvSession.operador_atual.id,
        // Pega o ID do cliente da primeira transação de crediário (caso exista misto de pagamentos)
        cliente_db_id: finalPaymentsList.find(p => p.tipo === 'crediario')?.cliente_id || null,
        
        itens: cartItems.map(item => ({
            db_id: item.db_id,
            quantity: item.quantity,
            unitPrice: item.unitPrice
        })),
        
        pagamentos: finalPaymentsList.map(p => ({ 
            tipo: p.tipo, 
            valor: p.valor,
            metodo_id: p.metodo_id // Enviando o ID para o backend saber exatamente qual config usar
        })),
        
        total_calculado: totalVenda,
        override_auth: adminPassword ? { admin_senha: adminPassword } : null,
        cpf_nota: cpfNota 
    };

    try {
        const response = await fetch(`${API_URL}/vendas/finalizar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(vendaRequest)
        });
        
        const result = await response.json();
        
          if (!response.ok) {
            // Tratamento de Erros Específicos (Limite/Bloqueio)
            if (response.status === 402 || response.status === 403) { 
                const tipoBloqueio = response.status === 402 ? "Limite Excedido" : "Conta Bloqueada";
                toast.warning(tipoBloqueio, { 
                    description: `${result.detail}`,
                    duration: 6000 
                });
                setOverrideMessage(result.detail);
                setIsAwaitingOverride(true); // Prepara o estado para aceitar override
                return; 
            }

            throw new Error(result.detail || "Erro desconhecido ao finalizar venda.");
        }
        
        setIsOverrideModalOpen(false);
        onSaleSuccess(result.venda_id, troco); 
        
    } catch (error) {
        console.error("Erro no handleConfirmSale:", error);
        setErrorMessage(error.message);
        toast.error("Falha ao finalizar", { description: error.message });
    } finally {
        setIsLoading(false);
    }
  }, [currentInputValue, paymentsList, totalVenda, pdvSession, cartItems, activeSale, selectedClient, onSaleSuccess, valorRestante, selectedMethodId, availableMethods]);

  // --- CONFIGURAÇÃO DO BOTÃO PRINCIPAL (ACTION BUTTON) ---
  const mainButtonConfig = React.useMemo(() => {
      // Caso de carregamento inicial
      if (!selectedMethod) {
          return { text: "Carregando...", icon: <Loader2 className="animate-spin" />, disabled: true, action: () => {} };
      }

      // ESTADO 1: Crediário sem cliente -> "Selecionar Cliente"
      if (selectedMethod.tipo === 'crediario' && !selectedClient) {
          return {
              text: "Selecionar Cliente",
              icon: <Search className="mr-2 h-5 w-5" />,
              hotkey: "F3", 
              action: () => setIsClientModalOpen(true),
              disabled: isLoading
          };
      }

      const valorInput = parseFloat(currentInputValue) || 0;
      
      // ESTADO 2: Valor menor que o restante -> "Adicionar Pagamento"
      if (valorRestante > 0.01 && valorInput < (valorRestante - 0.01)) {
          return {
              text: "Adicionar Pagamento",
              icon: null, 
              hotkey: "Enter", 
              action: handleAddPayment,
              disabled: isLoading || valorInput <= 0
          };
      }

      // ESTADO 3: Valor quita a dívida -> "Finalizar Venda"
      return {
          text: "Finalizar Venda",
          icon: null, 
          hotkey: "F1",
          action: () => handleConfirmSale(),
          disabled: isLoading || (valorInput <= 0 && valorRestante > 0.01)
      };
  }, [selectedMethod, selectedClient, currentInputValue, valorRestante, isLoading, handleAddPayment, handleConfirmSale]);

React.useEffect(() => {
    const handleKeyDown = (e) => {
      // ✅ 1. GUARDA ABSOLUTA: Se não for etapa de pagamento, o pai fica SURDO.
      // Isso impede que o ESC do CPF feche o modal inteiro ou o Enter finalize a venda.
      if (step !== 'payment') return;
      
      // ✅ 2. GUARDAS DE OUTROS MODAIS
      if (!open || isLoading || isClientModalOpen || isOverrideModalOpen) return; 

      // --- Daqui para baixo, lógica normal de pagamento ---

      const methodWithHotkey = availableMethods.find(m => m.hotkey === e.key);
      if (methodWithHotkey) {
          e.preventDefault();
          if (methodWithHotkey.tipo === 'crediario' && isAwaitingOverride) {
              setIsOverrideModalOpen(true);
              setIsAwaitingOverride(false);
              return;
          }
          setSelectedMethodId(String(methodWithHotkey.id));
          return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        handleOnOpenChange(false); // Só aqui o ESC fecha o modal de venda
      }
      
      if (e.key === 'Enter' || e.key === 'F1') {
         e.preventDefault();
         handlePrimaryAction();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
    
    // As dependências garantem que o listener se atualize quando o 'step' mudar
  }, [open, step, isLoading, isClientModalOpen, isOverrideModalOpen, availableMethods, isAwaitingOverride, currentInputValue, selectedMethodId]);

  // --- SUB-COMPONENTE DE STATUS DO CREDIÁRIO ---
  const CrediarioStatus = ({ client, onRemove }) => {
    if (!client) {
        return (
            <div className="py-10 text-center text-muted-foreground flex flex-col items-center gap-2 opacity-50 animate-in fade-in zoom-in-95">
                <User className="h-16 w-16" />
                <p className="text-lg">Nenhum cliente selecionado</p>
                <p className="text-sm">Pressione F3 para buscar</p>
            </div>
        );
    }
  
    return (
      <div className="py-6 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-4 p-4 bg-primary/10 rounded-lg border border-primary/20 w-full justify-between">
              <div className="flex items-center gap-4">
                  <User className="h-8 w-8 text-primary" />
                  <div className="text-left">
                      <p className="font-bold text-lg">{client.nome}</p>
                      <p className="text-sm text-muted-foreground">CPF: {client.cpf || '---'}</p>
                  </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onRemove}>
                  <X className="h-5 w-5" />
              </Button>
          </div>
          <div className="flex gap-8 text-center">
              <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Limite Disponível</p>
                  <p className="font-mono text-xl text-primary">
                    {client.limite_disponivel === Infinity || client.limite_disponivel === null
                        ? 'Ilimitado' 
                        : (client.limite_disponivel).toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                  </p>
              </div>
              {client.limite_total && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Limite Total</p>
                    <p className="font-mono text-xl text-muted-foreground">
                        {client.limite_total.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}
                    </p>
                  </div>
              )}
          </div>
        </div>
      );
  };

    const handlePrimaryAction = () => {
      if (currentMethod.tipo === 'crediario' && !selectedClient) { setIsClientModalOpen(true); return; }
      const valorInput = parseFloat(currentInputValue) || 0;
      if (valorInput < (valorRestante - 0.001)) { handleAddPayment(); } 
      else { handleConfirmSale(); }
  };

  return (
    <>
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogContent className="sm:max-w-lg p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        
        {/* ✅ RENDERIZAÇÃO CONDICIONAL */}
        {step === 'cpf' ? (
            <CpfPrompt onConfirm={handleCpfConfirm} onSkip={handleCpfSkip} />
        ) : (
            // Fragmento envolvendo toda a UI de Pagamento
            <> 
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-2xl">Finalizar Venda</DialogTitle>
                    <div className="flex justify-between items-baseline pt-2">
                        <DialogDescription className="text-lg">Total da Venda:</DialogDescription>
                        <p className="text-2xl font-bold text-muted-foreground">{totalVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                    {cpfNota && (
                        <div className="flex justify-end mt-1 animate-in fade-in">
                            <span className="text-xs bg-muted px-2 py-1 rounded text-muted-foreground font-mono flex items-center gap-1">
                                <User className="h-3 w-3" /> CPF: {cpfNota}
                            </span>
                        </div>
                    )}
                    <div className={cn("flex justify-between items-baseline", valorRestante <= 0 && "text-green-600")}>
                        <DialogDescription className="text-lg font-semibold">{valorRestante <= 0 ? "Troco:" : "Restante:"}</DialogDescription>
                        <p className="text-4xl font-bold">{Math.abs(valorRestante).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                    </div>
                </DialogHeader>

                {paymentsList.length > 0 && (
                    <div className="px-6 space-y-2">
                        <Label>Pagamentos Registrados:</Label>
                        <div className="space-y-1 max-h-24 overflow-y-auto p-2 bg-muted rounded-md">
                            {paymentsList.map((p, index) => (
                                <div key={index} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <span className="capitalize font-semibold">{p.nome_exibicao || p.tipo}</span>
                                        {p.cliente_nome && <span className="text-xs text-muted-foreground">({p.cliente_nome})</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span>{p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setPaymentsList(prev => prev.filter((_, i) => i !== index))}><X className="h-4 w-4 text-destructive" /></Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="px-6">
                    <Tabs value={String(selectedMethodId || "")} onValueChange={setSelectedMethodId} className="w-full">
                        <TabsList className="grid w-full grid-cols-4 mb-4 h-auto flex-wrap">
                            {availableMethods.map(method => (
                                <TabsTrigger key={method.id} value={String(method.id)} className="flex gap-1 items-center justify-center">
                                    {getMethodIcon(method.tipo)}
                                    <span className="ml-1">{method.nome}</span>
                                    {method.hotkey && <Kbd className="ml-1">{method.hotkey}</Kbd>}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        
                        <div className="space-y-2 py-4">
                            <Label htmlFor="valor-pagamento" className="text-lg">
                                {currentMethod.tipo === 'crediario' ? 'Valor a Lançar' : `Valor (${currentMethod.nome || ''})`}
                            </Label>
                            <CurrencyInput ref={inputRef} id="valor-pagamento" className="text-4xl h-16 p-4 text-right font-mono" value={currentInputValue} onChange={setCurrentInputValue} 
                                onKeyDown={(e) => { if (e.key === 'Enter' && !isClientModalOpen && !isOverrideModalOpen) { e.preventDefault(); e.stopPropagation(); handlePrimaryAction(); } }}
                                placeholder="R$ 0,00" disabled={isLoading || (valorRestante <= 0 && currentMethod.tipo !== 'outros')} />
                        </div>
                        
                        {availableMethods.map(method => (
                            <TabsContent key={method.id} value={String(method.id)}>
                                {method.tipo === 'crediario' ? (
                                    <CrediarioStatus selectedClient={selectedClient} onRemoveClient={() => setSelectedClient(null)} />
                                ) : (method.tipo !== 'dinheiro' && method.tipo !== 'especie') ? (
                                    <PlaceholderPayment method={method} onConfirm={() => { setCurrentInputValue(valorRestante); setTimeout(handleAddPayment, 0); }} />
                                ) : null}
                            </TabsContent>
                        ))}
                    </Tabs>
                </div>
                
                {errorMessage && ( <div className="px-6 pb-2"><p className="text-sm text-destructive text-center">{errorMessage}</p></div> )}

                <DialogFooter className="p-6 pt-2 bg-muted/50 rounded-b-lg">
                  <Button variant="outline" size="lg" disabled={isLoading} onClick={() => handleOnOpenChange(false)}>Cancelar <Kbd className="ml-2">ESC</Kbd></Button>
                  <Button 
                     type="button" size="lg" onClick={handlePrimaryAction} 
                     disabled={mainButtonConfig.disabled} 
                     className="min-w-[200px]"
                  >
                     {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : mainButtonConfig.icon}
                     {mainButtonConfig.text}
                     <Kbd className="ml-2">{mainButtonConfig.hotkey}</Kbd>
                 </Button>
                </DialogFooter>
            </>
        )}
      </DialogContent>
    </Dialog>
    
    <ClientSelectionModal open={isClientModalOpen} onOpenChange={setIsClientModalOpen} onClientSelect={(client) => { setSelectedClient(client); setTimeout(() => inputRef.current?.focus(), 100); }} />
    <LimitOverrideModal open={isOverrideModalOpen} onOpenChange={setIsOverrideModalOpen} message={overrideMessage} onConfirmOverride={handleOverrideConfirm} />
    </>
  )
}
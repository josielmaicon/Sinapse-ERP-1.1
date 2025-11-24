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

export function PaymentModal({ open, onOpenChange, cartItems, pdvSession, onSaleSuccess, activeSale }) {
  // --- ESTADOS DE DADOS ---
  const [availableMethods, setAvailableMethods] = React.useState([]); // Lista de métodos vindos da API
  const [selectedMethodId, setSelectedMethodId] = React.useState(null); // ID do método selecionado (aba atual)

  // --- ESTADOS DE CONTROLE ---
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState("");
  const [isClientModalOpen, setIsClientModalOpen] = React.useState(false);
  
  // --- ESTADOS DO INPUT E PAGAMENTOS ---
  const [currentInputValue, setCurrentInputValue] = React.useState(0); 
  const [paymentsList, setPaymentsList] = React.useState([]); 
  const [selectedClient, setSelectedClient] = React.useState(null); 
  
  // --- ESTADOS DE OVERRIDE (QUEBRA DE LIMITE) ---
  const [isOverrideModalOpen, setIsOverrideModalOpen] = React.useState(false);
  const [overrideMessage, setOverrideMessage] = React.useState("");
  const [isAwaitingOverride, setIsAwaitingOverride] = React.useState(false);

  const inputRef = React.useRef(null);

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

  // --- LÓGICA DE AÇÕES ---

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
        override_auth: adminPassword ? { admin_senha: adminPassword } : null
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

  // --- ESCUTAR TECLADO (HOTKEYS DINÂMICAS) ---
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Guards: Não executar atalhos se modais secundários estiverem abertos ou carregando
      if (!open || isLoading || isClientModalOpen || isOverrideModalOpen) return; 

      const pressedKey = e.key.toUpperCase();
      
      // 1. Atalhos Dinâmicos de Métodos (F5, F6, etc, definidos no Banco)
      const methodMatch = availableMethods.find(m => 
        m.hotkey && m.hotkey.toUpperCase() === pressedKey
      );

      if (methodMatch) {
        e.preventDefault();
        setSelectedMethodId(String(methodMatch.id));
        return;
      }
      
      // 2. Atalho de Override (F8) - Se estiver aguardando liberação
      if (pressedKey === 'F8' && isAwaitingOverride) { 
          e.preventDefault();
          setIsOverrideModalOpen(true);
          return;
      }

      // 3. Fechar Modal
      if (e.key === 'Escape') { 
          e.preventDefault(); 
          onOpenChange(false); 
          return;
      }
      
      // 4. Ação Principal (Enter ou F1)
      // Normaliza para comparar corretamente
      const isMainHotkey = e.key.toLowerCase() === mainButtonConfig.hotkey?.toLowerCase();
      const isEnterAlias = e.key === 'Enter' && (mainButtonConfig.hotkey === 'F1' || mainButtonConfig.hotkey === 'Enter');

      if (isMainHotkey || isEnterAlias) {
         e.preventDefault();
         if (!mainButtonConfig.disabled) {
             mainButtonConfig.action();
         }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  
  }, [open, isLoading, mainButtonConfig, isAwaitingOverride, availableMethods, isClientModalOpen, isOverrideModalOpen, onOpenChange]);

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

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        
        {/* CABEÇALHO DO MODAL */}
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

        {/* LISTA DE PAGAMENTOS REGISTRADOS */}
        {paymentsList.length > 0 && (
            <div className="px-6 space-y-2">
                <Label>Pagamentos Registrados:</Label>
                <div className="space-y-1 max-h-24 overflow-y-auto p-2 bg-muted rounded-md custom-scrollbar">
                    {paymentsList.map((p, index) => (
                        <div key={index} className="flex justify-between items-center text-sm animate-in fade-in slide-in-from-left-2">
                            <div className="flex items-center gap-2">
                                {/* Ícone baseado no tipo */}
                                {getMethodIcon(p.tipo)}
                                
                                <span className="capitalize font-medium">{p.nome_exibicao}</span>
                                {p.cliente_nome && <span className="text-xs text-muted-foreground">({p.cliente_nome})</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-mono">{p.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive" onClick={() => handleRemovePayment(index)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <div className="px-6">
            {/* ABAS DINÂMICAS */}
            {/* O value da Tab é controlado pelo selectedMethodId (string) */}
            <Tabs value={String(selectedMethodId || "")} onValueChange={setSelectedMethodId} className="w-full">
                
                {/* Lista de Abas gerada dinamicamente */}
                <TabsList 
                    className="w-full grid h-auto p-1 bg-muted/50" 
                    style={{ 
                        gridTemplateColumns: `repeat(${Math.max(1, availableMethods.length)}, minmax(0, 1fr))` 
                    }}
                >
                    {availableMethods.map((method) => (
                        <TabsTrigger 
                            key={method.id} 
                            value={String(method.id)}
                            className="flex flex-col sm:flex-row items-center justify-center gap-1 py-2 sm:py-1.5"
                        >
                            <span className="truncate text-xs sm:text-sm">{method.nome}</span>
                            {method.hotkey && (
                                <Kbd className="text-[10px] h-5 px-1 bg-background/50 text-muted-foreground font-normal">
                                    {method.hotkey}
                                </Kbd>
                            )}
                        </TabsTrigger>
                    ))}
                </TabsList>
                
                <div className="space-y-4 py-6">
                    {/* Input de Valor */}
                    <div className="space-y-2">
                        <Label htmlFor="valor-pagamento" className="text-lg flex justify-between items-center">
                            <span>
                                {selectedMethod?.tipo === 'crediario' ? 'Valor a Lançar' : `Valor (${selectedMethod?.nome || '...'})`}
                            </span>
                            {selectedMethod?.taxa > 0 && (
                                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
                                    Taxa: {selectedMethod.taxa}%
                                </span>
                            )}
                        </Label>
                        <CurrencyInput 
                            ref={inputRef}
                            id="valor-pagamento"
                            className="text-4xl h-16 p-4 text-right font-mono tracking-tight"
                            value={currentInputValue}
                            onChange={setCurrentInputValue} 
                            onKeyDown={(e) => {
                               if (e.key === 'Enter') {
                                   e.preventDefault();
                                   e.stopPropagation();
                                   if (!mainButtonConfig.disabled) {
                                       mainButtonConfig.action();
                                   }
                               }
                            }}
                            placeholder="R$ 0,00"
                            disabled={isLoading}
                        />
                    </div>

                    {/* Conteúdo Específico por TIPO (Renderização Condicional) */}
                    <div className="min-h-[20px]">
                        {selectedMethod?.tipo === 'crediario' && (
                           <CrediarioStatus 
                                client={selectedClient} 
                                onRemove={() => setSelectedClient(null)}
                           />
                        )}
                        
                        {selectedMethod?.tipo === 'pix' && (
                             <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm opacity-70">
                                 <QrCode className="h-4 w-4" />
                                 <span>QR Code será gerado na tela do cliente</span>
                             </div>
                        )}
                    </div>
                </div>
            </Tabs>
        </div>

        {/* MENSAGEM DE ERRO */}
        {errorMessage && (
             <div className="px-6 pb-4 animate-in slide-in-from-top-2">
                 <div className="bg-destructive/10 border border-destructive/20 p-3 rounded-md text-center">
                     <p className="text-sm text-destructive font-medium">{errorMessage}</p>
                 </div>
             </div>
         )}
        
        {/* RODAPÉ E BOTÕES DE AÇÃO */}
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
            
              {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                  mainButtonConfig.icon
              )}
              {mainButtonConfig.text}
              {mainButtonConfig.hotkey && (
                  <Kbd className="ml-2 bg-primary-foreground/20 text-primary-foreground border-transparent">
                      {mainButtonConfig.hotkey}
                  </Kbd>
              )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    
    <ClientSelectionModal 
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        onClientSelect={(client) => {
            setSelectedClient(client);
            // Retorna o foco para o input após selecionar
            setTimeout(() => inputRef.current?.focus(), 150);
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
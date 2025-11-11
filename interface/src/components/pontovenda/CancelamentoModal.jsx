"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { Loader2, Trash2, Minus, Plus } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Kbd } from "@/components/ui/kbd"
import { cn } from "@/lib/utils"
import { useWebSocket } from "@/WebSocketContext"

const API_URL = "http://localhost:8000";

export function CancelItemModal({ 
    open, 
    onOpenChange, 
    cartItems, 
    onConfirmRemoval, 
    onTotalSaleCancel,
    pdvSession, // A sessão (pode ser 'null' no início)
    activeSale // A venda
}) {
  
  const [step, setStep] = React.useState('cancel_action'); 
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  
  const [selectedItemId, setSelectedItemId] = React.useState(null);
  const [quantityToRemove, setQuantityToRemove] = React.useState('1');
  
  const [adminPassword, setAdminPassword] = React.useState('');
  const [pendingAction, setPendingAction] = React.useState(null); 
  const [pendingSolicitacaoId, setPendingSolicitacaoId] = React.useState(null);

  const tableContainerRef = React.useRef(null);
  const passwordInputRef = React.useRef(null);

  // Pega a última mensagem do canal global
  const { lastMessage } = useWebSocket(); 

  const selectedItem = React.useMemo(() => 
      cartItems.find(item => item.id === selectedItemId)
  , [cartItems, selectedItemId]);

  // --- Lógica de Reset (Quando o Modal Abre) ---
  React.useEffect(() => {
    if (open) {
      setStep('cancel_action'); 
      setPendingAction(null);
      setIsProcessing(false);
      setQuantityToRemove('1');
      if (cartItems.length > 0) setSelectedItemId(cartItems[0].id);
      
      setAdminPassword('');
      setErrorMessage('');
      setPendingSolicitacaoId(null); 

      setTimeout(() => tableContainerRef.current?.focus(), 50);
    }
  }, [open, cartItems]);

  // --- Lógica de Foco nos Passos ---
  React.useEffect(() => {
    if (open) {
        if (step === 'cancel_action') {
            setTimeout(() => tableContainerRef.current?.focus(), 50);
        } else if (step === 'admin_auth') {
            setTimeout(() => passwordInputRef.current?.focus(), 50);
        }
    }
  }, [open, step]);

  
  // --- O "OUVIDO" (Reage a aprovações remotas) ---
  React.useEffect(() => {
      // Ouve apenas no Passo 2 e se tivermos um ID de solicitação
      if (step !== 'admin_auth' || !lastMessage || !pendingSolicitacaoId) return;

      if (
          lastMessage.type === 'SOLICITACAO_CONCLUIDA' &&
          lastMessage.payload.id === pendingSolicitacaoId
      ) {
          console.log(`Socket: Resposta recebida para Solicitação ${pendingSolicitacaoId}`);
          
          if (lastMessage.payload.status === 'aprovado') {
              toast.success("Aprovado remotamente!", { description: "Autorização recebida do gerente." });
              handleSuccess(null); // Aprovado! (sem credenciais)
          } else {
              toast.error("Rejeitado remotamente", { description: "O gerente rejeitou a solicitação." });
              handleGoBackToAction(); // Volta para o Passo 1
          }
          
          setPendingSolicitacaoId(null); // Limpa o ID
      }
  }, [lastMessage, step, pendingSolicitacaoId]); // Depende do lastMessage


  // --- Ação de Sucesso (Chamada pelo Caminho Presencial ou Remoto) ---
  const handleSuccess = React.useCallback(async (adminCreds) => {
      if (!pendingAction) return; 
      
      setIsProcessing(true);
      try {
          if (pendingAction.type === 'partial') {
              await onConfirmRemoval(pendingAction.payload, adminCreds);
              toast.info("Item(ns) removido(s).");
          } else if (pendingAction.type === 'total') {
              await onTotalSaleCancel(adminCreds);
          }
          onOpenChange(false); // Fecha este modal

      } catch (error) {
          setErrorMessage(error.message); 
          console.error("Falha na execução do cancelamento:", error);
          setTimeout(() => passwordInputRef.current?.select(), 50);
      } finally {
          setIsProcessing(false);
      }
  }, [pendingAction, onConfirmRemoval, onTotalSaleCancel, onOpenChange]);


  // --- O "GRITO" (Envia a solicitação para os Gerentes) ---
  const startAwaitingAuthorization = React.useCallback(async (action) => {
      if (isProcessing) return;
      
      // ✅ A TRAVA DE SEGURANÇA (Onde estava o Bug)
      if (!pdvSession || !pdvSession.operador_atual || !activeSale) {
          console.error("Sessão ou Venda Ativa estão nulas. Não é possível criar solicitação.", pdvSession, activeSale);
          // Define o erro no modal, em vez de travar o app
          setErrorMessage("Dados de sessão ou venda incompletos. Tente reabrir o caixa (F1).");
          setStep('admin_auth'); // Avança para o passo 2, mas mostra o erro
          return;
      }
      
      setPendingAction(action);
      setStep('admin_auth');
      setErrorMessage('');

      // 1. (Opcional) Cria a solicitação no backend para alertar gerentes
      try {
          const response = await fetch(`${API_URL}/solicitacoes/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  tipo: action.type === 'total' ? 'cancelamento_venda' : 'cancelamento_item',
                  // Envia o payload da ação (ex: { item_db_id: 123, ... })
                  // ou o ID da venda se for total
                  detalhes: JSON.stringify(action.payload || { venda_id: activeSale.id }), 
                  pdv_id: pdvSession.id,
                  operador_id: pdvSession.operador_atual.id
              })
          });
          const data = await response.json();
          if (response.ok) {
              setPendingSolicitacaoId(data.id); // Salva o ID do pedido para o "Ouvido"
              console.log(`Socket: Solicitação ${data.id} enviada. Aguardando...`);
          } else {
              throw new Error(data.detail || "Falha ao enviar solicitação.");
          }
      } catch (e) { 
          console.error("Falha ao criar solicitação:", e);
          setErrorMessage(`Falha ao contatar gerentes: ${e.message}`);
      }
      
      // (A conexão de socket já está aberta globalmente, não precisamos conectar aqui)

  }, [isProcessing, pdvSession, activeSale]); // Depende da sessão


  // --- Gatilhos (Chamados pelo Passo 1) ---
  const handleTriggerPartialRemoval = React.useCallback(() => {
    if (!selectedItem) return;
    const removeCount = parseInt(quantityToRemove, 10);
    if (isNaN(removeCount) || removeCount <= 0 || removeCount > selectedItem.quantity) {
      toast.error(`Quantidade inválida. Máximo: ${selectedItem.quantity}.`);
      return;
    }
    startAwaitingAuthorization({
      type: 'partial',
      payload: { item_db_id: selectedItem.item_db_id, quantidade_a_remover: removeCount }
    });
  }, [selectedItem, quantityToRemove, startAwaitingAuthorization]);
  
  const handleTriggerTotalCancel = React.useCallback(() => {
    startAwaitingAuthorization({ type: 'total' });
  }, [startAwaitingAuthorization]);

  // --- Caminho 2: Ação do Passo 2 (Senha Local) ---
  const handleAuthAndExecute = React.useCallback(async () => {
    const adminCreds = { admin_senha: adminPassword };
    if (!adminCreds.admin_senha) {
        setErrorMessage("A senha do administrador é obrigatória.");
        return;
    }
    await handleSuccess(adminCreds);
  }, [adminPassword, handleSuccess]);

  // Voltar do Passo 2 para o 1
  const handleGoBackToAction = React.useCallback(() => {
    setStep('cancel_action');
    setPendingAction(null);
    setAdminPassword('');
    setErrorMessage('');
    setPendingSolicitacaoId(null); // Para de ouvir
  }, []);


  // --- Navegação por Teclado (useEffect complexo) ---
  React.useEffect(() => {
    const navigateTable = (direction) => {
        if (cartItems.length === 0) return;
        const currentIndex = cartItems.findIndex(item => item.id === selectedItemId);
        let nextIndex = currentIndex + direction;
        if (nextIndex < 0) nextIndex = 0;
        if (nextIndex >= cartItems.length) nextIndex = cartItems.length - 1;
        if (currentIndex !== nextIndex && cartItems[nextIndex]) {
            setSelectedItemId(cartItems[nextIndex].id);
        }
    };
    const changeQuantity = (direction) => {
        if (!selectedItem) return;
        const currentQty = parseInt(quantityToRemove, 10) || 1;
        const newQty = Math.min(selectedItem.quantity, Math.max(1, currentQty + direction));
        setQuantityToRemove(String(newQty));
    };

    const handleGlobalKeyDown = (e) => {
        if (!open) return; 

        if (step === 'cancel_action') {
            if (e.key === '+' || e.key === '-') e.preventDefault();
            if (e.key.match(/^[0-9]$/)) { /* ... */ }
            switch (e.key) {
                case 'ArrowUp':   e.preventDefault(); navigateTable(-1); break;
                case 'ArrowDown': e.preventDefault(); navigateTable(1); break;
                case 'Enter':     e.preventDefault(); handleTriggerPartialRemoval(); break;
                case 'F4':        e.preventDefault(); handleTriggerTotalCancel(); break;
                case 'Escape':    e.preventDefault(); onOpenChange(false); break;
                case '+':         e.preventDefault(); changeQuantity(1); break;
                case '-':         e.preventDefault(); changeQuantity(-1); break;
                default: break;
            }
        } 
        else if (step === 'admin_auth') {
            switch (e.key) {
                case 'Enter':     e.preventDefault(); handleAuthAndExecute(); break;
                case 'Escape':    e.preventDefault(); handleGoBackToAction(); break;
                default: break;
            }
        }
    };

    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
        document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [
    open, step, cartItems, selectedItemId, selectedItem, quantityToRemove, 
    handleTriggerPartialRemoval, handleTriggerTotalCancel, 
    handleAuthAndExecute, handleGoBackToAction, onOpenChange, adminPassword,
    isProcessing
  ]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl" onOpenAutoFocus={(e) => e.preventDefault()}>
        
        {/* === PASSO 1: AÇÕES DE CANCELAMENTO === */}
        {step === 'cancel_action' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Remover Produto(s) do Carrinho <Kbd>F3</Kbd></DialogTitle>
              <DialogDescription>
                Use <Kbd>&uarr;</Kbd> <Kbd>&darr;</Kbd> para selecionar, <Kbd>+</Kbd> <Kbd>-</Kbd> para quantidade, <Kbd>Enter</Kbd> para confirmar.
              </DialogDescription>
            </DialogHeader>

            <div 
              className="max-h-64 overflow-y-auto border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              ref={tableContainerRef}
              tabIndex={-1} 
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/2">Produto</TableHead>
                    <TableHead className="w-1/4 text-center">Qtd.</TableHead>
                    <TableHead className="w-1/4 text-right">Preço</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cartItems.map((item) => (
                    <TableRow 
                      key={item.id} 
                      data-state={item.id === selectedItemId && "selected"}
                      onClick={() => setSelectedItemId(item.id)}
                      className="cursor-pointer"
                    >
                      <TableCell className="font-medium text-sm">{item.name}</TableCell>
                      <TableCell className="text-center">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {item.totalPrice.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Controles de Quantidade */}
            {selectedItem && (
              <div className="flex items-center justify-between mt-4">
                <Label className="font-semibold text-lg" htmlFor="quantity-input">Quantidade:</Label>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" onClick={() => setQuantityToRemove(prev => String(Math.max(1, (parseInt(prev, 10) || 1) - 1)))} disabled={isProcessing || (parseInt(quantityToRemove, 10) || 1) <= 1}>
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    id="quantity-input" 
                    type="number"
                    min="1"
                    max={selectedItem.quantity}
                    value={quantityToRemove}
                    onChange={(e) => setQuantityToRemove(String(Math.min(selectedItem.quantity, Math.max(1, parseInt(e.target.value, 10) || 1))))}
                    className="w-20 text-center"
                    disabled={isProcessing}
                  />
                  <Button variant="outline" size="icon" onClick={() => setQuantityToRemove(prev => String(Math.min(selectedItem.quantity, (parseInt(prev, 10) || 1) + 1)))} disabled={isProcessing || (parseInt(quantityToRemove, 10) || 1) >= selectedItem.quantity}>
                    <Plus className="h-4 w-4" />
                  </Button>
                  
                  <Button variant="destructive" className="ml-4" onClick={handleTriggerTotalCancel} disabled={isProcessing}>
                    <Trash2 className="mr-2 h-4 w-4" /> Cancelar Venda Total <Kbd>F4</Kbd>
                  </Button>
                </div>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                Cancelar <Kbd>Esc</Kbd>
              </Button>
              <Button onClick={handleTriggerPartialRemoval} disabled={isProcessing || !selectedItem}>
                Remover Item <Kbd>Enter</Kbd>
              </Button>
            </DialogFooter>
          </>
        )}

        {/* === PASSO 2: AUTENTICAÇÃO (Híbrida) === */}
        {step === 'admin_auth' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Autenticação Necessária</DialogTitle>
              <DialogDescription>
                {isProcessing ? "Processando..." : (
                  pendingSolicitacaoId 
                    ? `Aguardando aprovação remota (ID: ${pendingSolicitacaoId}) OU insira a senha local.`
                    : "Enviando solicitação... (ou insira a senha local)"
                )}
              </DialogDescription>
            </DialogHeader>
            
            {errorMessage && (
              <Alert variant="destructive" className="my-4">
                <AlertTitle>Erro na Autorização</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 py-4">
              <Label htmlFor="admin-password-cancel">Senha de Administrador</Label>
              <Input 
                id="admin-password-cancel" 
                type="password" 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                ref={passwordInputRef}
                disabled={isProcessing}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleGoBackToAction} disabled={isProcessing}>
                Voltar <Kbd>Esc</Kbd>
              </Button>
              <Button type="button" onClick={handleAuthAndExecute} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Processando...' : 'Autorizar Local'} <Kbd className="ml-2">Enter</Kbd>
              </Button>
            </DialogFooter>
          </>
        )}
        
      </DialogContent>
    </Dialog>
  );
}
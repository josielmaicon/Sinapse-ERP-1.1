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

const API_URL = "http://localhost:8000";

export function CancelItemModal({ open, onOpenChange, cartItems, onConfirmRemoval, onTotalSaleCancel }) {
  // --- ESTADO DA ESTEIRA ---
  const [step, setStep] = React.useState('cancel_action'); 
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  
  // --- ESTADO DO PASSO 1 ---
  const [selectedItemId, setSelectedItemId] = React.useState(null);
  const [quantityToRemove, setQuantityToRemove] = React.useState('1');
  
  // --- ESTADO DO PASSO 2 ---
  const [adminPassword, setAdminPassword] = React.useState('');
  const [pendingAction, setPendingAction] = React.useState(null); 

  // --- ✅ Refs para Gerenciamento de Foco ---
  const tableContainerRef = React.useRef(null);
  const passwordInputRef = React.useRef(null);

  const selectedItem = React.useMemo(() => 
      cartItems.find(item => item.id === selectedItemId)
  , [cartItems, selectedItemId]);

  // --- ✅ Lógica de Foco e Reset ---
  React.useEffect(() => {
    if (open) {
      // Reseta Passo 1 (Ação)
      setStep('cancel_action'); 
      setPendingAction(null);
      setIsProcessing(false);
      setQuantityToRemove('1');
      if (cartItems.length > 0) {
        setSelectedItemId(cartItems[0].id);
      } else {
        setSelectedItemId(null);
      }
      
      // Reseta Passo 2 (Auth)
      setAdminPassword('');
      setErrorMessage('');

      // Foca na tabela assim que o modal abrir
      setTimeout(() => tableContainerRef.current?.focus(), 50);

    }
  }, [open, cartItems]); // Apenas 'open' e 'cartItems'

  // --- ✅ Lógica de Foco nos Passos ---
  React.useEffect(() => {
    if (open) {
        if (step === 'cancel_action') {
            // Foca na tabela para navegação
            setTimeout(() => tableContainerRef.current?.focus(), 50);
        } else if (step === 'admin_auth') {
            // Foca na senha
            setTimeout(() => passwordInputRef.current?.focus(), 50);
        }
    }
  }, [open, step]); // Dispara quando o passo muda

  
  // --- Funções de Gatilho (agora estáveis com useCallback) ---
  const handleTriggerPartialRemoval = React.useCallback(() => {
    if (!selectedItem) return;
    
    const removeCount = parseInt(quantityToRemove, 10);
    if (isNaN(removeCount) || removeCount <= 0 || removeCount > selectedItem.quantity) {
      toast.error(`Quantidade inválida. Máximo: ${selectedItem.quantity}.`);
      return;
    }
    
    setPendingAction({
      type: 'partial',
      payload: { item_db_id: selectedItem.item_db_id, quantidade_a_remover: removeCount }
    });
    setStep('admin_auth');
    setErrorMessage('');
  }, [selectedItem, quantityToRemove]);
  
  const handleTriggerTotalCancel = React.useCallback(() => {
    setPendingAction({ type: 'total' });
    setStep('admin_auth');
    setErrorMessage('');
  }, []);

  const handleAuthAndExecute = React.useCallback(async () => {
    if (!pendingAction) {
      setErrorMessage("Nenhuma ação pendente foi definida.");
      return;
    }

    // 1. Coletar as credenciais
    const adminCreds = {
        admin_senha: adminPassword
    };

    if (!adminCreds.admin_senha) {
        setErrorMessage("A senha do administrador é obrigatória.");
        return;
    }
    
    setIsProcessing(true);
    setErrorMessage('');
    
    try {
      // 2. Passar as credenciais para a função do pai
      if (pendingAction.type === 'partial') {
        // ✅ CORRIGIDO: Passa (payload, adminCreds)
        await onConfirmRemoval(pendingAction.payload, adminCreds);
        toast.info("Item(ns) removido(s).");

      } else if (pendingAction.type === 'total') {
        // ✅ CORRIGIDO: Passa (adminCreds)
        await onTotalSaleCancel(adminCreds);
        // O toast de sucesso já vem do PontoVenda.jsx
      }
      
      onOpenChange(false); 

    } catch (error) {
      // O erro (agora formatado) vem do PontoVendaPage.jsx
      setErrorMessage(error.message); 
      console.error("Falha na execução do cancelamento:", error);
    } finally {
      setIsProcessing(false);
      // Foca na senha se errar
      if (errorMessage) {
        setTimeout(() => passwordInputRef.current?.select(), 50);
      }
    }
  }, [pendingAction, adminPassword, onConfirmRemoval, onTotalSaleCancel, onOpenChange, errorMessage]); // Adicionado adminPassword

  const handleGoBackToAction = React.useCallback(() => {
    setStep('cancel_action');
    setPendingAction(null);
    setAdminPassword('');
    setErrorMessage('');
  }, []);


  // --- ✅ NAVEGAÇÃO POR TECLADO ---
  React.useEffect(() => {
    const navigateTable = (direction) => {
        if (cartItems.length === 0) return;
        
        const currentIndex = cartItems.findIndex(item => item.id === selectedItemId);
        let nextIndex = currentIndex + direction;

        if (nextIndex < 0) nextIndex = 0;
        if (nextIndex >= cartItems.length) nextIndex = cartItems.length - 1;

        if (currentIndex !== nextIndex) {
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
        if (!open) return; // Modal fechado, não faz nada

        // --- Passo 1: Ação de Cancelamento ---
        if (step === 'cancel_action') {
            // Previne que o "+" e "-" mudem o input de número se ele não estiver focado
            if (e.key === '+' || e.key === '-') e.preventDefault();
            
            // Foca no input de quantidade se o usuário digitar um número
            if (e.key.match(/^[0-9]$/)) {
                // (Opcional: focar no input de quantidade)
                // document.getElementById('quantity-input')?.focus(); 
            }

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
        // --- Passo 2: Autenticação ---
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
    open, step, cartItems, selectedItemId, selectedItem, quantityToRemove, // Dependências para os handlers
    handleTriggerPartialRemoval, handleTriggerTotalCancel, 
    handleAuthAndExecute, handleGoBackToAction, onOpenChange, adminPassword
  ]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        
        {/* === PASSO 1: AÇÕES DE CANCELAMENTO === */}
        {step === 'cancel_action' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Remover Produto(s) do Carrinho <kbd>F3</kbd></DialogTitle>
              <DialogDescription>
                Use <kbd>&uarr;</kbd> <kbd>&darr;</kbd> para selecionar, <kbd>+</kbd> <kbd>-</kbd> para quantidade, <kbd>Enter</kbd> para confirmar.
              </DialogDescription>
            </DialogHeader>

            {/* ✅ Foco e tabIndex -1 para ser focável via script mas não via Tab */}
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
                    <Button 
                      variant="outline" size="icon" 
                      onClick={() => setQuantityToRemove(prev => String(Math.max(1, (parseInt(prev, 10) || 1) - 1)))}
                      disabled={isProcessing || (parseInt(quantityToRemove, 10) || 1) <= 1}
                    >
                      <Minus className="h-4 w-4" /><kbd className="ml-1.5">-</kbd>
                    </Button>
                    <Input
                      id="quantity-input" // ✅ ID para o Label e foco
                      type="number"
                      min="1"
                      max={selectedItem.quantity}
                      value={quantityToRemove}
                      onChange={(e) => setQuantityToRemove(String(Math.min(selectedItem.quantity, Math.max(1, parseInt(e.target.value, 10) || 1))))}
                      className="w-20 text-center"
                      disabled={isProcessing}
                    />
                    <Button 
                      variant="outline" size="icon" 
                      onClick={() => setQuantityToRemove(prev => String(Math.min(selectedItem.quantity, (parseInt(prev, 10) || 1) + 1)))}
                      disabled={isProcessing || (parseInt(quantityToRemove, 10) || 1) >= selectedItem.quantity}
                    >
                      <Plus className="h-4 w-4" /><kbd className="ml-1.5">+</kbd>
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      className="ml-4"
                      onClick={handleTriggerTotalCancel}
                      disabled={isProcessing}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Cancelar Venda Total <kbd>F4</kbd>
                    </Button>
                </div>
              </div>
            )}

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
                Cancelar <kbd>Esc</kbd>
              </Button>
              <Button onClick={handleTriggerPartialRemoval} disabled={isProcessing || !selectedItem}>
                Remover Item <kbd>Enter</kbd>
              </Button>
            </DialogFooter>
          </>
        )}

        {/* === PASSO 2: AUTENTICAÇÃO DE ADMIN === */}
        {step === 'admin_auth' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl">Autenticação Necessária</DialogTitle>
              <DialogDescription>
                Insira a senha de qualquer administrador ou aguarde a aprovação da sua solicitação.
              </DialogDescription>
            </DialogHeader>
            
            {errorMessage && (
              <Alert variant="destructive" className="my-4">
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2 py-4">
              <Label htmlFor="admin-password-cancel">Senha do Administrador</Label>
              <Input 
                id="admin-password-cancel" 
                type="password" 
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                // ✅ Remove o autoFocus nativo para controlar manualmente com o ref
                // autoFocus 
                ref={passwordInputRef} // ✅ Ref para focar
                disabled={isProcessing}
                // ✅ Remove o keydown daqui, pois já é tratado globalmente
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleGoBackToAction} disabled={isProcessing}>
                Voltar <kbd>Esc</kbd>
              </Button>
              <Button type="button" onClick={handleAuthAndExecute} disabled={isProcessing}>
                {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isProcessing ? 'Processando...' : 'Confirmar Ação'} <kbd className="ml-2">Enter</kbd>
              </Button>
            </DialogFooter>
          </>
        )}
        
      </DialogContent>
    </Dialog>
  );
}
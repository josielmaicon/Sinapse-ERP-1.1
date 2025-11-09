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
import { Loader2, User, Search, Banknote, CreditCard, Smartphone, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { CurrencyInput } from "../ui/input-monetario"
import { Kbd } from "@/components/ui/kbd"
import { ClientSelectionModal } from "./ModalSelecaoCliente"

const API_URL = "http://localhost:8000"; 

export function RecebimentoModal({ open, onOpenChange, pdvSession }) {
  const [selectedClient, setSelectedClient] = React.useState(null);
  const [isClientModalOpen, setIsClientModalOpen] = React.useState(false);
  
  const [paymentType, setPaymentType] = React.useState("dinheiro");
  const [valorRecebido, setValorRecebido] = React.useState(0);
  
  const [isLoading, setIsLoading] = React.useState(false);
  const inputRef = React.useRef(null);

  // --- Foco e Reset ---
  React.useEffect(() => {
    if (open && !isClientModalOpen) {
      // Se abriu e não tem cliente, sugere selecionar
      if (!selectedClient) {
          // Poderíamos abrir automaticamente, mas talvez seja melhor deixar o usuário escolher
          // setIsClientModalOpen(true); 
      } else {
          // Se já tem cliente, foca no valor
          setTimeout(() => inputRef.current?.focus(), 100);
      }
    }
  }, [open, isClientModalOpen, selectedClient]);

  // --- Reset ao fechar ---
  const handleOnOpenChange = (isOpen) => {
      if (isLoading) return;
      if (!isOpen) {
          setSelectedClient(null);
          setValorRecebido(0);
          setPaymentType("dinheiro");
      }
      onOpenChange(isOpen);
  }

  // --- Ação Principal: RECEBER ---
  const handleConfirmReceipt = async () => {
      if (!selectedClient) { toast.error("Selecione um cliente primeiro."); return; }
      if (valorRecebido <= 0) { toast.error("Informe um valor maior que zero."); return; }
      
      setIsLoading(true);

      const payload = {
          valor_pago: valorRecebido,
          forma_pagamento: paymentType,
          pdv_id: pdvSession.id,
          operador_id: pdvSession.operador_atual.id
      };

      try {
          // ✅ Chama a nova rota do backend
          const response = await fetch(`${API_URL}/clientes/${selectedClient.id}/receber-pagamento`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });

          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.detail || "Erro ao processar recebimento.");
          }

          const updatedClient = await response.json();
          
          toast.success(`Recebimento de R$ ${valorRecebido.toFixed(2)} registrado!`, {
              description: `Novo saldo de ${updatedClient.nome}: ${updatedClient.saldo_devedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`
          });

          handleOnOpenChange(false); // Fecha e reseta

      } catch (error) {
          console.error(error);
          toast.error("Falha no recebimento", { description: error.message });
      } finally {
          setIsLoading(false);
      }
  };

  // --- Hotkeys Locais ---
  React.useEffect(() => {
      if (!open || isClientModalOpen) return;
      const handleKeyDown = (e) => {
          if (e.key === 'F3') { e.preventDefault(); setIsClientModalOpen(true); }
          if (e.key === 'Enter' && selectedClient && valorRecebido > 0) {
              e.preventDefault(); handleConfirmReceipt();
          }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, isClientModalOpen, selectedClient, valorRecebido]);

  return (
    <>
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-6 w-6 text-green-600" />
              Recebimento de Crediário
          </DialogTitle>
          <DialogDescription>
            Registre o pagamento de dívidas de clientes.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-6">
            {/* 1. Seleção de Cliente */}
            {!selectedClient ? (
                <Button variant="outline" className="w-full h-16 text-lg" onClick={() => setIsClientModalOpen(true)}>
                    <Search className="mr-2 h-6 w-6" /> Selecionar Cliente <Kbd className="ml-2">F3</Kbd>
                </Button>
            ) : (
                <div className="bg-muted p-4 rounded-lg border flex justify-between items-center">
                    <div>
                        <p className="font-bold text-lg">{selectedClient.nome}</p>
                        <p className="text-sm text-muted-foreground">
                            Dívida Atual: <span className="text-destructive font-semibold">
                                {selectedClient.saldo_devedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </span>
                        </p>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => setSelectedClient(null)}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            )}

            {/* 2. Valor e Forma de Pagamento (Só mostra se tiver cliente) */}
            {selectedClient && (
                <Tabs value={paymentType} onValueChange={setPaymentType} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="dinheiro">Dinheiro</TabsTrigger>
                        <TabsTrigger value="pix">PIX</TabsTrigger>
                        <TabsTrigger value="cartao_debito">Débito</TabsTrigger>
                    </TabsList>
                    
                    <div className="pt-4">
                        <Label htmlFor="valor-recebimento" className="text-lg">Valor a Receber</Label>
                        <CurrencyInput 
                            ref={inputRef}
                            id="valor-recebimento"
                            className="text-4xl h-16 p-4 text-right font-mono mt-2"
                            value={valorRecebido}
                            onChange={setValorRecebido}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirmReceipt()}
                            placeholder="R$ 0,00"
                            disabled={isLoading}
                        />
                        {/* Sugestão de Dívida Total */}
                        <div className="flex justify-end mt-1">
                            <Button 
                                variant="link" size="sm" className="h-auto p-0 text-blue-600"
                                onClick={() => setValorRecebido(selectedClient.saldo_devedor)}
                            >
                                Receber Total ({selectedClient.saldo_devedor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                            </Button>
                        </div>
                    </div>
                </Tabs>
            )}
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={() => handleOnOpenChange(false)} disabled={isLoading}>
                Cancelar
            </Button>
            <Button 
                onClick={handleConfirmReceipt} 
                disabled={isLoading || !selectedClient || valorRecebido <= 0}
                className="min-w-[150px]"
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Recebimento
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Modal Filho de Seleção */}
    <ClientSelectionModal 
        open={isClientModalOpen}
        onOpenChange={setIsClientModalOpen}
        onClientSelect={setSelectedClient}
    />
    </>
  )
}
"use client"

import * as React from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const API_URL = "http://localhost:8000";

export function OpenClosePdvModal({ open, onOpenChange, actionType, pdv, refetchData, operators }) {
  const [step, setStep] = React.useState('admin_password');
  const [adminPassword, setAdminPassword] = React.useState('');
  const [verifiedAdminId, setVerifiedAdminId] = React.useState(null);
  const [selectedOperatorId, setSelectedOperatorId] = React.useState('');
  const [cashValue, setCashValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const isOpening = actionType === 'open';
  const title = isOpening ? `Abrir Caixa: ${pdv?.nome}` : `Fechar Caixa: ${pdv?.nome}`;

  React.useEffect(() => {
    if (open) {
      setStep('admin_password');
      setAdminPassword('');
      setVerifiedAdminId(null);
      setSelectedOperatorId('');
      setCashValue('');
      setIsLoading(false);
      setErrorMessage('');
    }
  }, [open, pdv, actionType]);

  // --- Manipulador de Avanço/Submissão ---
  const handleNextStep = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (step === 'admin_password') {
        // ✅ 1. CHAMADA REAL para verificar senha
        const response = await fetch(`${API_URL}/api/auth/verify-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: adminPassword })
        });
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.detail || "Erro ao verificar senha.");
        }
        
        setVerifiedAdminId(result.admin_id); // Guarda o ID real do admin
        
        if (isOpening) {
          setStep('operator_select');
        } else {
          // ✅ 2. CHAMADA REAL para verificar vendas ativas
          const salesCheckResponse = await fetch(`${API_URL}/api/pdvs/${pdv.id}/has-active-sales`);
          const salesCheckResult = await salesCheckResponse.json();
          if (!salesCheckResponse.ok) {
              throw new Error(salesCheckResult.detail || "Erro ao verificar vendas ativas.");
          }
          if (salesCheckResult.has_active_sales) {
              throw new Error("Não é possível fechar o caixa. Existem vendas em andamento neste PDV.");
          }
          
          setStep('cash_count'); 
          console.log("COMANDO: Abrir gaveta para contagem de fechamento");
        }
      } else if (step === 'operator_select') {
        if (!selectedOperatorId) throw new Error("Selecione um operador.");
        setStep('cash_count');
        console.log("COMANDO: Abrir gaveta para contagem de abertura");
      } else if (step === 'cash_count') {
        const value = parseFloat(cashValue);
        if (isNaN(value) || value < 0) throw new Error("Valor em caixa inválido.");
        
        let apiPromise;
        let endpoint = '';
        let body = {};

        if (isOpening) {
          // ✅ 3. PREPARAÇÃO para chamada real de ABRIR
          endpoint = `${API_URL}/api/pdvs/${pdv.id}/open`;
          body = { 
            admin_id: verifiedAdminId, 
            operador_id: parseInt(selectedOperatorId), 
            valor_abertura: value 
          };
        } else { // Fechamento
          // ✅ 4. PREPARAÇÃO para chamada real de FECHAR
          endpoint = `${API_URL}/api/pdvs/${pdv.id}/close`;
          body = { 
            admin_id: verifiedAdminId, 
            valor_fechamento: value 
          };
        }

        // ✅ 5. EXECUÇÃO da chamada real (Abrir ou Fechar)
        apiPromise = fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        })
        .then(async (response) => {
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.detail || `Erro ao ${isOpening ? 'abrir' : 'fechar'} o caixa.`);
            }
            return result; // Retorna o PDV atualizado pelo backend
        });

        // O toast.promise continua igual, ele vai executar a chamada real
        toast.promise(apiPromise, {
          loading: isOpening ? "Abrindo caixa..." : "Fechando caixa...",
          success: (updatedPdv) => {
            refetchData(); 
            onOpenChange(false); 
            return `Caixa ${updatedPdv.nome} ${isOpening ? 'aberto' : 'fechado'} com sucesso!`;
          },
          error: (err) => err.message,
          // Não precisamos mais do setIsLoading(false) aqui
        });
        return; 
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
    setIsLoading(false); // Só chega aqui se houve erro ANTES do toast.promise
  };
  
  // --- Manipulador de Enter ---
  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
          e.preventDefault(); 
          handleNextStep();
      }
  };

  return (
    // ... O JSX do Modal continua exatamente igual ...
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>
                    {step === 'admin_password' && "Digite a senha de um administrador para continuar."}
                    {step === 'operator_select' && "Selecione o operador que assumirá este caixa."}
                    {step === 'cash_count' && (isOpening ? "Conte o dinheiro na gaveta e informe o valor inicial." : "Conte o dinheiro na gaveta e informe o valor final.")}
                </DialogDescription>
            </DialogHeader>

            {errorMessage && (
                <Alert variant="destructive" className="mb-4">
                    <AlertTitle>Erro</AlertTitle>
                    <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4 py-2">
                {/* Passo 1: Senha Admin */}
                {step === 'admin_password' && (
                    <div className="space-y-2">
                        <Label htmlFor="admin-password">Senha do Administrador</Label>
                        <Input 
                            id="admin-password" 
                            type="password" 
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            onKeyDown={handleKeyDown} 
                            autoFocus 
                        />
                    </div>
                )}

                {/* Passo 2: Selecionar Operador (Só na Abertura) */}
                {step === 'operator_select' && isOpening && (
                    <div className="space-y-2">
                        <Label htmlFor="operator-select">Operador do Caixa</Label>
                        <Select value={selectedOperatorId} onValueChange={setSelectedOperatorId}>
                            <SelectTrigger id="operator-select">
                                <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                            <SelectContent>
                                {operators.map(op => (
                                    <SelectItem key={op.id} value={String(op.id)}>{op.nome}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {/* Passo 3: Contar Dinheiro */}
                {step === 'cash_count' && (
                    <div className="space-y-2">
                        <Label htmlFor="cash-value">Valor em Caixa (R$)</Label>
                        <Input 
                            id="cash-value" 
                            type="number" 
                            step="0.01" 
                            placeholder="Ex: 150.75" 
                            value={cashValue}
                            onChange={(e) => setCashValue(e.target.value)}
                            onKeyDown={handleKeyDown} 
                            autoFocus 
                        />
                    </div>
                )}
            </div>

            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                    Cancelar
                </Button>
                <Button type="button" onClick={handleNextStep} disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {step === 'cash_count' ? (isOpening ? 'Abrir Caixa' : 'Fechar Caixa') : 'Próximo'}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
  );
}
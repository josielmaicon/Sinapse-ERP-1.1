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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert" // Para mostrar erros

const API_URL = "http://localhost:8000";

// Estados possíveis: 'admin_password', 'operator_select', 'cash_count', 'confirm'
// Adicionaremos 'checking_sales' para a verificação antes de fechar

export function OpenClosePdvModal({ open, onOpenChange, actionType, pdv, refetchData, operators }) {
  const [step, setStep] = React.useState('admin_password');
  const [adminPassword, setAdminPassword] = React.useState('');
  const [verifiedAdminId, setVerifiedAdminId] = React.useState(null); // Guarda o ID do admin verificado
  const [selectedOperatorId, setSelectedOperatorId] = React.useState('');
  const [cashValue, setCashValue] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  const isOpening = actionType === 'open';
  const title = isOpening ? `Abrir Caixa: ${pdv?.nome}` : `Fechar Caixa: ${pdv?.nome}`;

  // Reseta tudo quando o modal é fechado ou o PDV/Ação muda
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
  
  // --- Funções (Simuladas) de API ---
  const verifyAdminPassword = async (password) => {
      // SIMULAÇÃO: No backend, verificaria a senha e retornaria o ID do admin ou erro
      console.log("Verificando senha admin:", password);
      await new Promise(resolve => setTimeout(resolve, 500)); // Simula espera
      if (password === "admin123") { // Senha de teste
          return { admin_id: 1, name: "Admin Teste" }; // Retorna o ID do admin verificado
      } else {
          throw new Error("Senha de administrador inválida.");
      }
  };

  const checkActiveSales = async (pdvId) => {
      // SIMULAÇÃO: No backend, checaria se há vendas com status 'em_andamento'
      console.log("Verificando vendas ativas para PDV:", pdvId);
      await new Promise(resolve => setTimeout(resolve, 300));
      // Vamos simular que não há vendas ativas
      const hasActiveSales = false; 
      if (hasActiveSales) {
          throw new Error("Não é possível fechar o caixa. Existem vendas em andamento neste PDV.");
      }
      return true; // Pode prosseguir
  };
  
  const submitOpenPdv = async (data) => {
      // SIMULAÇÃO: Chamaria POST /api/pdvs/{pdv_id}/open
      console.log("Enviando dados para ABRIR PDV:", data);
      await new Promise(resolve => setTimeout(resolve, 700));
      // Simula sucesso
      return { ...pdv, status: 'aberto', operador_atual: operators.find(op => op.id == data.operador_id) }; 
  };

  const submitClosePdv = async (data) => {
      // SIMULAÇÃO: Chamaria POST /api/pdvs/{pdv_id}/close
      console.log("Enviando dados para FECHAR PDV:", data);
      await new Promise(resolve => setTimeout(resolve, 700));
      // Simula sucesso
      return { ...pdv, status: 'fechado', operador_atual: null }; 
  };
  
  // --- Manipulador de Avanço/Submissão ---
  const handleNextStep = async () => {
    setIsLoading(true);
    setErrorMessage('');
    try {
      if (step === 'admin_password') {
        const admin = await verifyAdminPassword(adminPassword);
        setVerifiedAdminId(admin.admin_id); // Guarda o ID do admin!
        if (isOpening) {
          setStep('operator_select');
        } else {
          // Antes de fechar, verifica vendas ativas
          await checkActiveSales(pdv.id); 
          setStep('cash_count'); // Pula direto para contagem do dinheiro
          // Aqui você mandaria o comando para abrir a gaveta
          console.log("COMANDO: Abrir gaveta para contagem de fechamento");
        }
      } else if (step === 'operator_select') {
        if (!selectedOperatorId) throw new Error("Selecione um operador.");
        setStep('cash_count');
        // Aqui você mandaria o comando para abrir a gaveta
        console.log("COMANDO: Abrir gaveta para contagem de abertura");
      } else if (step === 'cash_count') {
        const value = parseFloat(cashValue);
        if (isNaN(value) || value < 0) throw new Error("Valor em caixa inválido.");
        
        let apiPromise;
        if (isOpening) {
          apiPromise = submitOpenPdv({ 
            admin_id: verifiedAdminId, 
            operador_id: parseInt(selectedOperatorId), 
            valor_abertura: value 
          });
        } else { // Fechamento
          apiPromise = submitClosePdv({ 
            admin_id: verifiedAdminId, 
            valor_fechamento: value 
          });
        }

        toast.promise(apiPromise, {
          loading: isOpening ? "Abrindo caixa..." : "Fechando caixa...",
          success: (updatedPdv) => {
            refetchData(); // Atualiza a tabela na página principal
            onOpenChange(false); // Fecha o modal
            return `Caixa ${updatedPdv.nome} ${isOpening ? 'aberto' : 'fechado'} com sucesso!`;
          },
          error: (err) => err.message,
        });
        // O toast agora gerencia o loading/finalização, não precisamos mais do setIsLoading(false) aqui
        return; // Retorna para evitar o setIsLoading(false) abaixo
      }
    } catch (error) {
      setErrorMessage(error.message);
    }
    setIsLoading(false);
  };
  
  // --- Manipulador de Enter ---
  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
          e.preventDefault(); // Evita submit padrão do form
          handleNextStep();
      }
  };

  return (
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